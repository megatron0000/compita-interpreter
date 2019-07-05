// Definition of all possible semantical errors

import { ASTNode, Program, Identifier, IdentifierReference, FunctionCall, Typed, VariableType, RegularFunction, Expression, IFunction } from "../abstracttree/definitions";
import { ISymbol, SymbolName } from "./symboltable";
import { Backmap } from "../conversion";
import { assertNotNull } from "../../common";

export interface CodeLocalization {
  line: number
  col: number
}

export interface CodeRange {
  begin: CodeLocalization
  end: CodeLocalization
}

export interface SemanticalError {
  message: string
  where: ASTNode
  localize(backmap: Backmap): CodeRange
}

export class DuplicateDeclaration implements SemanticalError {
  public message: string

  constructor(public where: ISymbol) {
    this.message = 'Symbol ' + SymbolName(where) + ' declared more than once'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class MissingMainFunction implements SemanticalError {
  public message: string

  constructor(public where: Program) {
    this.message = 'Missing main function'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class Undeclared implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference | FunctionCall) {
    this.message = 'Symbol ' + where.name + ' was used but not declared'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class NotAFunction implements SemanticalError {
  public message: string

  constructor(public where: FunctionCall) {
    this.message = 'Symbol ' + where.name + ' is not a function'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class NonVoidCall implements SemanticalError {
  public message: string

  constructor(public where: FunctionCall) {
    this.message = 'CALL on the non-void function ' + where.name
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class VoidIdentifier implements SemanticalError {
  public message: string

  constructor(public where: Identifier) {
    this.message = 'Void identifier ' + where.name
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class IncompatibleType implements SemanticalError {
  public message: string

  constructor(public where: Typed & ASTNode, public incompatibleWith: VariableType | VariableType[]) {
    this.message = 'Cannot cast type "' + where.resolvedType + '" to type "' +
      (Array.isArray(incompatibleWith) ? incompatibleWith.join('", or "') : incompatibleWith)
      + '"'
  }

  localize(backmap: Backmap) {
    const firstToken = assertNotNull(backmap.firstToken.get(this.where))
    const lastToken = assertNotNull(backmap.lastToken.get(this.where))
    return {
      begin: { line: firstToken.line, col: firstToken.col - 1 },
      end: {
        line: lastToken.line + lastToken.lineBreaks,
        col: lastToken.lineBreaks ? lastToken.text.slice(lastToken.text.lastIndexOf('\n') + 1).length : lastToken.col - 1 + lastToken.text.length
      }
    }
  }
}

export class NonPositiveVectorDimension implements SemanticalError {
  public message: string

  constructor(public where: Identifier) {
    this.message = 'Dimensionality constants for "' + where.name + '" must be positive'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }

}

export class NotInitialized implements SemanticalError {
  public message: string

  constructor(public where: Identifier) {
    this.message = '"' + where.name + '" was never initialized'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class NotReferenced implements SemanticalError {
  public message: string

  constructor(public where: Identifier | RegularFunction) {
    this.message = '"' + where.name + '" was never referenced'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class MismatchingDimensionality implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference, public rightDimensionality: number) {
    this.message = '"' + where.name + '" referenced with ' + where.subscripts.length + ' dimensions, but declared with ' + rightDimensionality
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class UnexpectedForInitialization implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference) {
    this.message = 'Expected a scalar int or scalar char instead of ' + where.name
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class UnrelatedForIncrement implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference, public initializerName: string) {
    this.message = 'Used ' + where.name + ' as increment variable, but ' + initializerName + ' as initializer variable'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class WrongIndexingType implements SemanticalError {
  public message: string

  constructor(public where: Expression) {
    this.message = 'Expected char or int expression as vector index, but got ' + where.resolvedType
  }

  localize(backmap: Backmap) {
    const firstToken = assertNotNull(backmap.firstToken.get(this.where))
    const lastToken = assertNotNull(backmap.lastToken.get(this.where))
    return {
      begin: { line: firstToken.line, col: firstToken.col - 1 },
      end: {
        line: lastToken.line + lastToken.lineBreaks,
        col: lastToken.lineBreaks ? lastToken.text.slice(lastToken.text.lastIndexOf('\n') + 1).length : lastToken.col - 1 + lastToken.text.length
      }
    }
  }
}

export class VoidInExpression implements SemanticalError {
  public message: string

  constructor(public where: Expression) {
    this.message = 'Expressions do not admit void values'
  }

  localize(backmap: Backmap) {
    const firstToken = assertNotNull(backmap.firstToken.get(this.where))
    const lastToken = assertNotNull(backmap.lastToken.get(this.where))
    return {
      begin: { line: firstToken.line, col: firstToken.col - 1 },
      end: {
        line: lastToken.line + lastToken.lineBreaks,
        col: lastToken.lineBreaks ? lastToken.text.slice(lastToken.text.lastIndexOf('\n') + 1).length : lastToken.col - 1 + lastToken.text.length
      }
    }
  }
}

export class SameNameAsProgram implements SemanticalError {
  public message: string

  constructor(public where: ISymbol) {
    this.message = 'Symbol named the same as program (' + SymbolName(where) + ')'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class FunctionPointerReference implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference) {
    this.message = 'Function pointer is not supported'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class ArgumentCountMismatch implements SemanticalError {
  public message: string

  constructor(public where: FunctionCall, rightNumberOfArgs: number) {
    this.message = where.name + ' declared with ' + rightNumberOfArgs + ' arguments but called with ' + where.arguments.length
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class NonVoidFunctionReturnsNothing implements SemanticalError {
  public message: string

  constructor(public where: RegularFunction) {
    this.message = 'Non-void function ' + where.name + ' must have a return statement'
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

export class RecursiveCall implements SemanticalError {
  public message: string

  /**
   * @param callCycle Do not repeat elements in the cycle
   */
  constructor(public where: FunctionCall, public callCycle: IFunction[]) {
    this.message = 'Recursive call: ' + callCycle.concat([callCycle[0]]).map(x => SymbolName(x)).join('->')
  }

  localize(backmap: Backmap) {
    const token = assertNotNull(backmap.nameToken.get(this.where))
    return {
      begin: { line: token.line, col: token.col - 1 },
      end: {
        line: token.line + token.lineBreaks,
        col: token.lineBreaks ? token.text.slice(token.text.lastIndexOf('\n') + 1).length : token.col - 1 + token.text.length
      }
    }
  }
}

