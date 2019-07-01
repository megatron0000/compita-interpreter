// SymbolTable definition

import { IFunction, Identifier } from "../abstracttree/definitions";

type IScope = GlobalScope | LocalScope

export interface GlobalScope {
  readonly kind: 'global'
}

export interface LocalScope {
  readonly kind: 'local',
  readonly function: IFunction,
}

export type ISymbol = Identifier | IFunction

export function SymbolName(symbol: ISymbol) {
  return symbol.kind === 'main' ? 'main' : symbol.name
}

export interface SymbolTable {

  createLocalScope(functionObj: IFunction): LocalScope

  registerSymbol(inScope: IScope, symbol: ISymbol): void

  /**
   * 
   * @param fromScope Scope to begin the search. Also searches the global scope later, if not found in local scope
   * @param symbolName 
   * @param dontFollowScopes If `true`, will search *only* in the requested scope
   */
  getSymbolEntry(fromScope: IScope, symbolName: string, dontFollowScopes: boolean): ISymbol | null

  getGlobalScope(): GlobalScope | null

  getLocalScope(functionName: string): LocalScope | null

}


export class SymbolTable implements SymbolTable {
  private globalScope: GlobalScope = { kind: 'global' }
  private localScopes: Map<string, LocalScope> = new Map()
  private scope2Symbols: Map<IScope, Map<string, ISymbol>> = new Map()

  constructor() {
    this.scope2Symbols.set(this.globalScope, new Map())
  }

  getGlobalScope() {
    return this.globalScope
  }

  /**
   * If the scope already existed, returns it instead of creating another
   */
  createLocalScope(functionObj: IFunction) {
    const functionName = SymbolName(functionObj)

    if(this.localScopes.has(functionName)) {
      return this.localScopes.get(functionName) as LocalScope
    }

    const scope = { kind: 'local', function: functionObj } as LocalScope

    this.localScopes.set(functionName, scope)
    this.scope2Symbols.set(scope, new Map())

    return scope
  }

  getLocalScope(functionName: string) {
    return this.localScopes.get(functionName) || null
  }

  registerSymbol(inScope: IScope, symbol: ISymbol) {
    const symbolName = SymbolName(symbol)
    const scope2Symbols = this.scope2Symbols.get(inScope)

    if (!scope2Symbols) {
      throw new Error('Tried to register symbol ' + symbol + ' to non-registered scope ' + inScope)
    }

    scope2Symbols.set(symbolName, symbol)
  }

  getSymbolEntry(fromScope: IScope, symbolName: string, dontFollowScopes: boolean = false) {
    let scope2Symbols = this.scope2Symbols.get(fromScope)

    if (!scope2Symbols) {
      throw new Error('Tried to get symbol ' + symbolName + ' from non-created scope ' + fromScope)
    }

    if (scope2Symbols.has(symbolName)) {
      return scope2Symbols.get(symbolName) as ISymbol
    }

    if (dontFollowScopes) {
      return null
    }

    scope2Symbols = this.scope2Symbols.get(this.globalScope)

    if (!scope2Symbols) {
      throw new Error('Inconsistency: Could not find symbol-map for global scope')
    }

    return scope2Symbols.get(symbolName) || null
  }

  dump(): { scope: IScope, symbolNames: string[] }[] {
    const result: { scope: IScope, symbolNames: string[] }[] = []
    this.scope2Symbols.forEach((symbols, scope) => result.push({
      scope,
      symbolNames: Array.from(symbols.keys())
    }))
    return result
  }

}