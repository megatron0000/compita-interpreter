// Visitors for the abstract tree which verify semantical information and report errors, if any

import { Program, Identifier } from "../abstracttree/definitions";
import { SymbolTable, SymbolName, ISymbol } from "./symboltable";
import { SemanticalError, DuplicateDeclaration } from "./errors";


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
      if (functionNode.kind === 'function') {
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

export class DeclareBeforeUse {
  execute(node: Program, table: SymbolTable): SemanticalError[] {
    const errors: SemanticalError[] = []

    node.functions.forEach(functionNode => {

    })

    return errors
  }
}