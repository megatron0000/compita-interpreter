/**
 * Disponibiliza informações sobre a estrutura
 * da sintaxe da COMPITA2019
 */

export interface Token {
  type: string,
  value: any,
  text: string,
  offset: number,
  lineBreaks: number,
  line: number,
  col: number
}

export interface SyntaxTree {
  nodeName: string,
  nodeChildren: (Token | SyntaxTree)[]
}

export function isToken(obj: any): obj is Token {
  return typeof obj.type === 'string'
}

export function isSyntaxTree(obj: any) : obj is SyntaxTree {
  return typeof obj.nodeName === 'string'
}

export function castClass(clazz: 'Token', obj: Token | SyntaxTree): Token
export function castClass(clazz: 'SyntaxTree', obj: Token | SyntaxTree): SyntaxTree
export function castClass(clazz: 'Token' | 'SyntaxTree', obj: Token | SyntaxTree): Token | SyntaxTree {
  if(clazz === 'Token' && !isToken(obj)) {
    throw new Error('Cannot cast to Token')
  }
  if (clazz === 'SyntaxTree' && !isSyntaxTree(obj)) {
    throw new Error('Cannot cast to SyntaxTree')
  }
  return obj
}

export function castType(type: string, obj: SyntaxTree): SyntaxTree
export function castType(type: string, obj: Token): Token
export function castType(type: string, obj: SyntaxTree | Token): SyntaxTree | Token {
  if (!isToken(obj) && !isSyntaxTree(obj)) {
    throw new Error('Is neither Token nor SyntaxTree')
  }
  
  if (isToken(obj) && obj.type !== type) {
    throw new Error(`(token type) Expected ${obj.type} to be ${type}`)
  }

  if (isSyntaxTree(obj) && obj.nodeName !== type) {
    throw new Error(`(node name) Expected ${obj.nodeName} to be ${type}`)
  }

  return obj
}

export function cast(clazz: 'Token', type: string, obj: SyntaxTree | Token): Token
export function cast(clazz: 'SyntaxTree', type: string, obj: SyntaxTree | Token): SyntaxTree
export function cast(clazz: 'Token' | 'SyntaxTree', type: string, obj: SyntaxTree | Token): Token | SyntaxTree {
  return castType(type, castClass(clazz as any, obj))
}