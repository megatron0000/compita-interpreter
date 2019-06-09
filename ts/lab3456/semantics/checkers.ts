// Visitors for the abstract tree which verify semantical information and report errors, if any

import { Program, Identifier, IdentifierReference, FunctionCall, ASTNode, RegularFunction, VariableType, IFunction } from "../abstracttree/definitions";
import { SymbolTable, SymbolName, ISymbol } from "./symboltable";
import { SemanticalError, DuplicateDeclaration, MissingMainFunction, Undeclared, NotAFunction, NonVoidCall, VoidIdentifier, IncompatibleType, NonPositiveVectorDimension, NotInitialized, NotReferenced, MismatchingDimensionality, UnexpectedForInitialization, UnrelatedForIncrement, WrongIndexingType, VoidInExpression, SameNameAsProgram, FunctionPointerReference, ArgumentCountMismatch, NonVoidFunctionReturnsNothing, RecursiveCall } from "./errors";
import { Find } from "../abstracttree/operators";
import assert = require("assert");
import { assertNotNull } from "../../common";

function castableFrom(toType: VariableType): VariableType[] {
  if (toType === 'int' || toType === 'char') {
    return ['int', 'char']
  }

  if (toType === 'float') {
    return ['int', 'char', 'float']
  }

  if (toType === 'logic') {
    return ['logic']
  }

  return ['void']
}

function canCast(fromType: VariableType, toType: VariableType): boolean {
  return new Set(castableFrom(toType)).has(fromType)
}

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
        if (!referencedSymbol) {
          return
        }

        // tried to call a non-function. not our problem...
        if (referencedSymbol.kind === 'identifier' && reference.kind === 'function call') {
          return
        }

        // tried to pass around a function-pointer. not our problem...
        if (new Set(['function', 'main']).has(referencedSymbol.kind) && reference.kind === 'identifier reference') {
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

    // resolve types for return statements
    Find(node, { kind: 'return' }).forEach(returnStatement => {
      returnStatement.resolvedType = !returnStatement.body ? 'void' : returnStatement.body.resolvedType
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
          // if called a non-function, this is not our problem
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

      // the operand has issues (example: is a call of a non-function). not our problem...
      if (
        (operation.kind === 'not' && !operation.target.resolvedType) ||
        (operation.kind !== 'not' && (!operation.leftSide.resolvedType || !operation.rightSide.resolvedType))
      ) {
        return
      }

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

      // operand has issues. not our problem
      if (!operation.leftSide.resolvedType || !operation.rightSide.resolvedType) {
        return
      }

      if (!isNumeric(operation.leftSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.leftSide, ['int', 'char', 'float']))
      }

      if (!isNumeric(operation.rightSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.rightSide, ['int', 'char', 'float']))
      }
    })

    Find(node, { kind: ['equal', 'not equal'] }).forEach(operation => {

      // operand has issues. not our problem
      if (!operation.leftSide.resolvedType || !operation.rightSide.resolvedType) {
        return
      }

      if (isNumeric(operation.leftSide.resolvedType) && !isNumeric(operation.rightSide.resolvedType)) {
        errors.push(new IncompatibleType(operation.rightSide, operation.leftSide.resolvedType))
      }

      if (!isNumeric(operation.leftSide) && isNumeric(operation.rightSide)) {
        errors.push(new IncompatibleType(operation.rightSide, operation.leftSide.resolvedType))
      }
    })

    Find(node, { kind: ['addition', 'subtraction', 'multiplication', 'division', 'negation'] }).forEach(operation => {

      // operand has issues. not our problem
      if (
        (operation.kind === 'negation' && !operation.target.resolvedType) ||
        (operation.kind !== 'negation' && (!operation.leftSide.resolvedType || !operation.rightSide.resolvedType))
      ) {
        return
      }

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

      // operand has issues. not our problem
      if (!operation.leftSide.resolvedType || !operation.rightSide.resolvedType) {
        return
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

export class AssignmentTypeCompatibility {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: 'assignment' }).forEach(assignment => {
      // operand has issues (example: it is a function-name)
      if (!assignment.leftSide.resolvedType || !assignment.rightSide.resolvedType) {
        return
      }

      if (!canCast(
        assertNotNull(assignment.rightSide.resolvedType),
        assertNotNull(assignment.leftSide.resolvedType))
      ) {
        errors.push(
          new IncompatibleType(assignment.rightSide, assignment.leftSide.resolvedType)
        )
      }
    })

    return errors
  }
}

export class IndexingDimensionsMustMatch {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(funcNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(funcNode)))

      Find(funcNode, { kind: 'identifier reference' }).forEach(reference => {
        const symbol = table.getSymbolEntry(localScope, reference.name)

        // did not declare. not our problem
        if (!symbol) {
          return
        }

        // tried to pass around a function-pointer. this is not our problem...
        if (symbol.kind !== 'identifier') {
          return
        }

        if (symbol.dimensions.length !== reference.subscripts.length) {
          errors.push(new MismatchingDimensionality(reference, symbol.dimensions.length))
        }

      })
    })

    return errors
  }
}

export class IfWhileDoForMustHaveLogicalExpressions {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: ['if', 'while', 'do', 'for'] }).forEach(branchingCommand => {
      // issues. not our problem
      if (!branchingCommand.condition.resolvedType) {
        return
      }

      if (branchingCommand.condition.resolvedType !== 'logic') {
        errors.push(new IncompatibleType(branchingCommand.condition, 'logic'))
      }
    })

    return errors
  }
}

export class ForMustBeInitializedByScalar {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: 'for' }).forEach(forCommand => {
      // issues. not our problem...
      if (!forCommand.initializer.leftSide.resolvedType) {
        return
      }

      if (!new Set(['int', 'char']).has(forCommand.initializer.leftSide.resolvedType) || forCommand.initializer.leftSide.subscripts.length > 0) {
        errors.push(new UnexpectedForInitialization(forCommand.initializer.leftSide))
      }
    })

    return errors
  }
}

export class ForInitializerMustMatchIncrement {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: 'for' }).forEach(forCommand => {
      if (forCommand.initializer.leftSide.name !== forCommand.increment.leftSide.name) {
        errors.push(new UnrelatedForIncrement(forCommand.increment.leftSide, forCommand.initializer.leftSide.name))
      }
    })

    return errors
  }
}

export class MustIndexWithIntLikeExpressions {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: 'identifier reference' }).forEach(reference => {
      reference.subscripts.forEach(indexer => {

        // issues... not our problem
        if (!indexer.resolvedType) {
          return
        }

        if (!canCast(indexer.resolvedType, 'int')) {
          errors.push(new WrongIndexingType(indexer))
        }
      })
    })

    return errors
  }
}

export class ExpressionDoesNotAdmitVoidCalls {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(functionNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(functionNode)))

      // process only CALL statements, as opposed to calls within expressions
      Find(functionNode, { kind: 'function call' })
        .filter(callsite => callsite.inExpression)
        .forEach(callsite => {
          const symbol = table.getSymbolEntry(localScope, callsite.name)
          // if called a non-function, this is not our problem
          if (!symbol || symbol.kind === 'identifier') {
            return
          }

          if (callsite.resolvedType === 'void') {
            errors.push(new VoidInExpression(callsite))
          }
        })
    })

    return errors
  }
}

export class NoClashWithProgramName {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    Find(node, { kind: ['identifier', 'function'] }).forEach(symbol => {
      if (symbol.name === node.name) {
        errors.push(new SameNameAsProgram(symbol))
      }
    })

    return errors
  }
}

export class NoFunctionPointers {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(funcNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(funcNode)))

      Find(funcNode, { kind: 'identifier reference' }).forEach(reference => {
        const symbol = table.getSymbolEntry(localScope, reference.name)

        // referenced bit did not declare... not our problem
        if (!symbol) {
          return
        }

        if (symbol.kind !== 'identifier') {
          errors.push(new FunctionPointerReference(reference))
        }
      })
    })

    return errors
  }
}

export class ArgumentCountsMustMatch {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(funcNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(funcNode)))

      Find(funcNode, { kind: 'function call' }).forEach(callsite => {
        const symbol = table.getSymbolEntry(localScope, callsite.name)

        // issues... not our problem
        if (!symbol || symbol.kind === 'identifier') {
          return
        }

        if (
          (symbol.kind === 'main' && callsite.arguments.length !== 0) ||
          (symbol.kind !== 'main' && symbol.arguments.length !== callsite.arguments.length)
        ) {
          errors.push(new ArgumentCountMismatch(callsite, symbol.kind === 'main' ? 0 : symbol.arguments.length))
        }
      })
    })

    return errors
  }
}

export class ArgumentTypesMustBeCompatible {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(funcNode => {
      const localScope = assertNotNull(table.getLocalScope(SymbolName(funcNode)))

      Find(funcNode, { kind: 'function call' }).forEach(callsite => {
        const symbol = table.getSymbolEntry(localScope, callsite.name)

        // issues... not our problem
        if (!symbol || symbol.kind === 'identifier') {
          return
        }

        // main has no args, so it does not matter
        if (symbol.kind === 'main') {
          return
        }

        symbol.arguments.forEach((formalArgument, index) => {
          // argument count mismatch... not our problem
          if (callsite.arguments.length <= index) {
            return
          }

          const callArgument = callsite.arguments[index]

          // issues... not our problem
          if (!callArgument.resolvedType) {
            return
          }

          if (!canCast(callArgument.resolvedType, formalArgument.type)) {
            errors.push(new IncompatibleType(callArgument, formalArgument.type))
          }
        })
      })
    })

    return errors
  }
}

export class ReturnStatementMustMatchFunctionType {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(funcNode => {
      const returns = Find(funcNode, { kind: 'return' })
      const funcType = funcNode.kind === 'main' ? 'void' : funcNode.returnType


      // a non-void function returns nothing
      if (funcType !== 'void' && returns.length === 0) {
        errors.push(new NonVoidFunctionReturnsNothing(funcNode as RegularFunction))
      }

      returns.forEach(returnStatement => {

        // issues... not our problem
        if (!returnStatement.resolvedType) {
          return
        }

        if (!canCast(returnStatement.resolvedType, funcType)) {
          errors.push(new IncompatibleType(returnStatement, funcType))
        }
      })

    })

    return errors
  }
}

export class RecursiveCallsAreNotSupported {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    // first resolve all calls
    type Call = { called: IFunction, callsite: FunctionCall, caller: IFunction }
    const caller2called = new Map<IFunction, Call[]>()
    node.functions.forEach(funcNode => {
      let called: Call[]
      if (!caller2called.has(funcNode)) {
        called = []
        caller2called.set(funcNode, called)
      } else {
        called = assertNotNull(caller2called.get(funcNode))
      }

      const localScope = assertNotNull(table.getLocalScope(SymbolName(funcNode)))

      Find(funcNode, { kind: 'function call' }).forEach(callsite => {
        const symbol = table.getSymbolEntry(localScope, callsite.name)

        // did not declare, or called a non-function... not our problem
        if (!symbol || symbol.kind === 'identifier') {
          return
        }

        called.push({ called: symbol, callsite, caller: funcNode })
      })
    })

    // now find cycles
    class Cycle {
      elems: string[] = []

      equals(other: Cycle) {
        return other.elems.length === this.elems.length &&
          other.elems.every((elem, index) => elem === this.elems[index])
      }

      add(elem: string) {
        this.elems.push(elem)
        this.elems = this.elems.sort()
      }

      has(elem: string) {
        return this.elems.indexOf(elem) !== -1
      }
    }

    class CycleSet {
      elems: Cycle[] = []

      equals(other: CycleSet) {
        return this.elems.length === other.elems.length &&
          this.elems.every((elem, index) => elem.equals(other.elems[index]))
      }

      add(elem: Cycle) {
        this.elems.push(elem)
        this.elems = this.elems.sort()
      }

      has(elem: Cycle) {
        return this.elems.some(mine => mine.equals(elem))
      }
    }

    const callchains: Call[][] = []
    const cycles: CycleSet = new CycleSet()

    /**
     * `path` always comes with 1 more element than `callchain`
     */
    function DFS(begin: IFunction, path: IFunction[], callchain: Call[]) {
      const called = assertNotNull(caller2called.get(begin))

      called.forEach(callinfo => {
        // cycle detected
        if (path.includes(callinfo.called)) {
          const index = path.indexOf(callinfo.called)
          const subpath = path.slice(index)
          const cycle = new Cycle()
          subpath.forEach(x => cycle.add(SymbolName(x)))
          const subcallchain = callchain.concat([callinfo]).slice(index)

          // already found earlier
          if (cycles.has(cycle)) {
            return
          }

          cycles.add(cycle)
          callchains.push(subcallchain)
        }
        // no cycle yet. search deeper
        else {
          DFS(
            callinfo.called,
            path.map(x => x).concat([callinfo.called]),
            callchain.map(x => x).concat([callinfo])
          )
        }
      })
    }

    caller2called.forEach((_, caller) => DFS(caller, [caller], []))

    // now just report the errors
    callchains.forEach(callchain => {
      callchain.forEach(callinfo => errors.push(new RecursiveCall(callinfo.caller, callchain.map(x => x.caller))))
    })

    return errors
  }
}