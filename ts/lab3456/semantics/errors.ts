// Definition of all possible semantical errors

import { ASTNode } from "../abstracttree/definitions";
import { ISymbol, SymbolName } from "./symboltable";


export interface SemanticalError {
  message: string
  where: ASTNode
}

export class DuplicateDeclaration implements SemanticalError {
  public message: string
  public where: ISymbol

  constructor(symbol: ISymbol) {
    this.message = 'Symbol ' + SymbolName(symbol) + ' declared more than once'
    this.where = symbol
  }
}