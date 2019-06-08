// Visitors for the abstract tree which verify semantical information and report errors, if any

import { Program, Identifier, IdentifierReference, FunctionCall, ASTNode, RegularFunction } from "../abstracttree/definitions";
import { SymbolTable, SymbolName, ISymbol } from "./symboltable";
import { SemanticalError, DuplicateDeclaration, MissingMainFunction, Undeclared, NotAFunction, NonVoidCall, VoidIdentifier, IncompatibleType, NonPositiveVectorDimension, NotInitialized, NotReferenced } from "./errors";
import { Find } from "../abstracttree/operators";
import assert = require("assert");
import { assertNotNull } from "../../common";


export class FillSymbolTable {
  execute(node: Program): [SymbolTable, SemanticalError[]] {
    const table = new SymbolTable()
    const errors: SemanticalError[] = []

    const globalScope = table.getGlobalScope()

    const globalSymbols = (node.declarations.map(x => x.identifier) as unknown as ISymbol[]).concat(node.functions)

    globalSymbols.forEach(symbol => {
      if (table.getSymbolEntry(globalScope, SymbolName(symbol), true)) {
        errors.push(new DuplicateDeclaration(symbol))
      } else {
        table.registerSymbol(globalScope, symbol)
      }
    })

    node.functions.forEach(functionNode => {

      const functionScope = table.createLocalScope(functionNode)

      // process arguments. they were not treated as identifiers
      // so we must create a new object for each of them
      if (functionNode.kind !== 'main') {
        functionNode.arguments.forEach(symbol => {
          if (table.getSymbolEntry(functionScope, SymbolName(symbol), true)) {
            errors.push(new DuplicateDeclaration(symbol))
          } else {
            table.registerSymbol(functionScope, symbol)
          }
        })
      }

      functionNode.declarations.map(x => x.identifier).forEach(symbol => {
        if (table.getSymbolEntry(functionScope, SymbolName(symbol), true)) {
          errors.push(new DuplicateDeclaration(symbol))
        } else {
          table.registerSymbol(functionScope, symbol)
        }
      })
    })

    return [table, errors]
  }


}

export class ResolveTypesInPlace {
  /**
   * Modifies `node` and its subtrees to fill the `resolvedType` fields
   */
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors = []

    // start by nodes that do not need their children to be resolved

    // resolve types for constants
    Find(node, { kind: 'boolean' }).forEach(x => x.resolvedType = 'logic')
    Find(node, { kind: 'character' }).forEach(x => x.resolvedType = 'char')
    Find(node, { kind: 'integer' }).forEach(x => x.resolvedType = 'int')
    Find(node, { kind: 'float' }).forEach(x => x.resolvedType = 'float')

    // resolve types for symbols (must know function scope)
    node.functions.forEach(functionNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(functionNode)))

      // resolve types for identifier references and function invocations
      Find(functionNode, { kind: ['identifier reference', 'function call'] }).forEach(reference => {
        const referencedSymbol = table.getSymbolEntry(localScope, reference.name)

        // not-declared symbols is not the problem solved by this class
        // we assign an impossible type to the symbol, in this case
        if (!referencedSymbol) {
          reference.resolvedType = 'void'
          return
        }

        reference.resolvedType = referencedSymbol.kind === 'identifier'
          ? referencedSymbol.type
          : referencedSymbol.kind === 'main'
            ? 'void'
            : referencedSymbol.returnType
      })

    })

    // resolve types for logical operations
    Find(node, {
      kind: ['or', 'and', 'not', 'less or equal', 'less than',
        'greater or equal', 'greater than', 'equal', 'not equal']
    }).forEach(logicalOperation => {
      logicalOperation.resolvedType = 'logic'
    })

    // resolve types for negation
    Find(node, { kind: 'negation' }).forEach(negation => negation.resolvedType = 'int')

    // resolve types for arithmetic operation (cast int to float if needed)
    Find(node, { kind: ['addition', 'subtraction', 'multiplication', 'division', 'modulus'] })
      .reverse() // reverse so the first elements are children of the others
      .forEach(operation => {
        // do not check sides compatibility
        // arithmetic always returns an int, unless some operand is a float
        operation.resolvedType = (operation.leftSide.resolvedType === 'float' ||
          operation.rightSide.resolvedType === 'float')
          ? 'float'
          : 'int'
      })



    return errors
  }
}

export class UniqueMainFunction {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    // the symbol table filler already detected if the program had duplicate main
    // now it only remains to detect if the program has no main
    if (table.getSymbolEntry(table.getGlobalScope(), 'main', true) === null) {
      errors.push(new MissingMainFunction(node))
    }

    return errors
  }
}

export class DeclareBeforeUse {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(functionNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(functionNode)))

      Find(functionNode, { kind: 'identifier reference' }).forEach(reference => {
        if (table.getSymbolEntry(localScope, reference.name) === null) {
          console.log(localScope)
          errors.push(new Undeclared(reference))
        }
      })

      Find(functionNode, { kind: 'function call' }).forEach(callsite => {
        console.log(localScope)
        if (table.getSymbolEntry(localScope, callsite.name) === null) {
          errors.push(new Undeclared(callsite))
        }
      })

    })

    return errors
  }
}

export class IfCalledThenIsFunction {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []
    const functions = node.functions

    functions.forEach(functionNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(functionNode)))

      Find(functionNode, { kind: 'function call' }).forEach(callsite => {
        const symbolentry = table.getSymbolEntry(localScope, callsite.name)

        // if calling a non-existent symbol, this is not the problem treated by this class
        if (symbolentry === null) {
          return
        }

        if (symbolentry.kind === 'identifier') {
          errors.push(new NotAFunction(callsite))
        }
      })
    })

    return errors
  }
}

export class CallStatementMustReturnVoid {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(functionNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(functionNode)))

      // process only CALL statements, as opposed to calls within expressions
      Find(functionNode, { kind: 'function call' })
        .filter(callsite => !callsite.inExpression)
        .forEach(callsite => {
          const symbol = table.getSymbolEntry(localScope, callsite.name)
          // if called a non-function, this is not out problem
          if (!symbol || symbol.kind === 'identifier') {
            return
          }

          if (callsite.resolvedType !== 'void') {
            errors.push(new NonVoidCall(callsite))
          }
        })
    })

    return errors
  }
}

export class NoVoidIdentifier {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: 'identifier' }).forEach(identifier => {
      if (identifier.type === 'void') {
        errors.push(new VoidIdentifier(identifier))
      }
    })

    return errors
  }
}


export class OperandsCompatibleWithOperators {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: ['or', 'and', 'not'] }).forEach(operation => {
      if ((operation.kind === 'or' || operation.kind === 'and') && operation.leftSide.resolvedType !== 'logic') {
        errors.push(new IncompatibleType(operation.leftSide, 'logic'))
      }

      if ((operation.kind === 'or' || operation.kind === 'and') && operation.rightSide.resolvedType !== 'logic') {
        errors.push(new IncompatibleType(operation.rightSide, 'logic'))
      }

      if (operation.kind === 'not' && operation.target.resolvedType !== 'logic') {
        errors.push(new IncompatibleType(operation.target, 'logic'))
      }

    })

    function isNumeric(type) {
      return type === 'int' || type === 'float' || type === 'char'
    }

    Find(node, { kind: ['less or equal', 'less than', 'greater or equal', 'greater than'] }).forEach(operation => {
      if (!isNumeric(operation.leftSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.leftSide, ['int', 'char', 'float']))
      }

      if (!isNumeric(operation.rightSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.rightSide, ['int', 'char', 'float']))
      }
    })

    Find(node, { kind: ['equal', 'not equal'] }).forEach(operation => {
      if (isNumeric(operation.leftSide.resolvedType) && !isNumeric(operation.rightSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.rightSide, operation.leftSide.resolvedType || 'void'))
      }

      if (!isNumeric(operation.leftSide) && isNumeric(operation.rightSide)) {
        errors.push(new IncompatibleType(operation.rightSide, operation.leftSide.resolvedType || 'void'))
      }
    })

    Find(node, { kind: ['addition', 'subtraction', 'multiplication', 'division', 'negation'] }).forEach(operation => {
      if (operation.kind === 'negation') {
        if (!isNumeric(operation.target.resolvedType)) {
          errors.push(new IncompatibleType(operation.target, ['int', 'char', 'float']))
        }
        return
      }

      if (!isNumeric(operation.leftSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.leftSide, ['int', 'char', 'float']))
      }

      if (!isNumeric(operation.rightSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.rightSide, ['int', 'char', 'float']))
      }
    })

    Find(node, { kind: 'modulus' }).forEach(operation => {
      function isIntLike(type) {
        return type === 'int' || type === 'char'
      }

      if (!isIntLike(operation.leftSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.leftSide, ['int', 'char']))
      }

      if (!isIntLike(operation.rightSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.rightSide, ['int', 'char']))
      }
    })



    return errors
  }
}

export class PositiveVectorDimensions {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: 'identifier' }).forEach(identifier => {
      if (identifier.dimensions.some(dim => dim <= 0)) {
        errors.push(new NonPositiveVectorDimension(identifier))
      }
    })

    return errors
  }
}

export class IfDeclaredThenMustInitializeAndReference {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    const referenced = new Map<Identifier | RegularFunction, boolean>()
    const initialized = new Map<Identifier, boolean>()

    // set every symbol as un-referenced, un-initialized
    Find(node, { kind: ['identifier', 'function'] }).forEach(obj => {
      // only variables can be "initialized"
      if (obj.kind === 'identifier') {
        initialized.set(obj, false)
      }

      referenced.set(obj, false)
    })

    // above, we included arguments in the 'set as un-initialized' mess.
    // but arguments are implicitly initialized
    Find(node, { kind: 'function' }).forEach(func => {
      func.arguments.forEach(arg => initialized.set(arg, true))
    })

    // collect all symbol-references inside function statements
    node.functions.forEach(functionNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(functionNode)))

      const isAssignment = new Map<IdentifierReference, boolean>()

      // find all initialization identifier-nodes
      // reads also count as initialization
      Find(functionNode, { kind: ['assignment', 'read'] }).forEach(obj => {
        const references = obj.kind === 'read' ? obj.receptors : [obj.leftSide]

        references.forEach(reference => {
          isAssignment.set(reference, true)

          const symbol = table.getSymbolEntry(localScope, reference.name)

          // if symbol was used-but-not-declared, this is not our problem
          if (!symbol) {
            return
          }

          initialized.set(symbol as Identifier, true)
        })
      })

      // find all references
      Find(functionNode, { kind: ['identifier reference', 'function call'] }).forEach(reference => {
        const symbol = table.getSymbolEntry(localScope, reference.name)

        // if symbol was used-but-not-declared, this is not our problem
        // also, the main function does not need to be called (although we will allow it)
        if (!symbol || symbol.kind === 'main') {
          return
        }

        referenced.set(symbol, true)
      })
    })

    // now pass the verdicts
    initialized.forEach((verdict, identifier) => {
      if (!verdict) {
        errors.push(new NotInitialized(identifier))
      }
    })

    referenced.forEach((verdict, obj) => {
      if (!verdict) {
        errors.push(new NotReferenced(obj))
      }
    })

    return errors
  }
}