// Definition of all possible semantical errors

import { ASTNode, Program, Identifier, IdentifierReference, FunctionCall, Typed, VariableType, RegularFunction } from "../abstracttree/definitions";
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
    this.message = 'Used non-positive constant(s) to specify dimensionality of vector-variable ' + where.name
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