// Definition of all possible semantical errors

import { ASTNode, Program, Identifier, IdentifierReference, FunctionCall, Typed, VariableType, RegularFunction, Assignment, Expression, IFunction } from "../abstracttree/definitions";
import { ISymbol, SymbolName } from "./symboltable";


export interface SemanticalError {
  message: string
  where: ASTNode
}

export class DuplicateDeclaration implements SemanticalError {
  public message: string

  constructor(public where: ISymbol) {
    this.message = 'Symbol ' + SymbolName(where) + ' declared more than once'
  }
}

export class MissingMainFunction implements SemanticalError {
  public message: string

  constructor(public where: Program) {
    this.message = 'Missing main function'
  }
}

export class Undeclared implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference | FunctionCall) {
    this.message = 'Symbol ' + where.name + ' was used but not declared'
  }
}

export class NotAFunction implements SemanticalError {
  public message: string

  constructor(public where: FunctionCall) {
    this.message = 'Symbol ' + where.name + ' is not a function'
  }
}

export class NonVoidCall implements SemanticalError {
  public message: string

  constructor(public where: FunctionCall) {
    this.message = 'CALL on the non-void function ' + where.name
  }
}

export class VoidIdentifier implements SemanticalError {
  public message: string

  constructor(public where: Identifier) {
    this.message = 'Void identifier ' + where.name
  }
}

export class IncompatibleType implements SemanticalError {
  public message: string

  constructor(public where: Typed & ASTNode, public incompatibleWith: VariableType | VariableType[]) {
    this.message = 'Cannot cast type "' + where.resolvedType + '" to type "' +
      (Array.isArray(incompatibleWith) ? incompatibleWith.join('", or "') : incompatibleWith)
      + '"'
  }
}

export class NonPositiveVectorDimension implements SemanticalError {
  public message: string

  constructor(public where: Identifier) {
    this.message = 'Dimensionality constants for "' + where.name + '" must be positive'
  }
}

export class NotInitialized implements SemanticalError {
  public message: string

  constructor(public where: Identifier) {
    this.message = '"' + where.name + '" was never initialized'
  }
}

export class NotReferenced implements SemanticalError {
  public message: string

  constructor(public where: Identifier | RegularFunction) {
    this.message = '"' + where.name + '" was never referenced'
  }
}

export class MismatchingDimensionality implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference, public rightDimensionality: number) {
    this.message = '"' + where.name + '" referenced with ' + where.subscripts.length + ' dimensions, but declared with ' + rightDimensionality
  }
}

export class UnexpectedForInitialization implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference) {
    this.message = 'Expected a scalar int or scalar char instead of ' + where.name
  }
}

export class UnrelatedForIncrement implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference, public initializerName: string) {
    this.message = 'Used ' + where.name + ' as increment variable, but ' + initializerName + ' as initializer variable'
  }
}

export class WrongIndexingType implements SemanticalError {
  public message: string

  constructor(public where: Expression) {
    this.message = 'Expected char or int expression as vector index, but got ' + where.resolvedType
  }
}

export class VoidInExpression implements SemanticalError {
  public message: string

  constructor(public where: Expression) {
    this.message = 'Expressions do not admit void values'
  }
}

export class SameNameAsProgram implements SemanticalError {
  public message: string

  constructor(public where: ISymbol) {
    this.message = 'Symbol named the same as program (' + SymbolName(where) + ')'
  }
}

export class FunctionPointerReference implements SemanticalError {
  public message: string

  constructor(public where: IdentifierReference) {
    this.message = 'Function pointer is not supported'
  }
}

export class ArgumentCountMismatch implements SemanticalError {
  public message: string

  constructor(public where: FunctionCall, rightNumberOfArgs: number) {
    this.message = where.name + ' declared with ' + rightNumberOfArgs + ' arguments but called with ' + where.arguments.length
  }
}

export class NonVoidFunctionReturnsNothing implements SemanticalError {
  public message: string

  constructor(public where: RegularFunction) {
    this.message = 'Non-void function ' + where.name + ' must return something'
  }
}

export class RecursiveCall implements SemanticalError {
  public message: string

  /**
   * @param callCycle Do not repeat elements in the cycle
   */
  constructor(public where: IFunction, public callCycle: IFunction[]) {
    this.message = 'Recursive call: ' + callCycle.concat([callCycle[0]]).map(x => SymbolName(x)).join('->')
  }
}
