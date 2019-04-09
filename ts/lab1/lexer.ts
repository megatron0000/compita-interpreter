import { empty_string, expose_global } from '../common'
import moo = require('moo')

// TODO: algumas linguagens deveriam aceitar cadeia vazia (o que o moo não permite)

const lexer1 = moo.compile({
  valido: /(?:(?:0*10*10*)+|(?:1*01*01*)+|0+|1+)(?![^])/,
  invalido: { match: /[^]+/, lineBreaks: true }
})

const lexer2 = moo.compile({
  invalido: {
    match: /(?:(?:0*10*10*)+|(?:1*01*01*)+|0+|1+|(?:[01]*[^01][01]*)+)(?![^])/,
    lineBreaks: true
  },
  valido: /.+/
})

const lexer3 = moo.compile({
  valido: {
    match: /(?:[01]+|(?:[01]*2[01]*2[01]*2[01]*2[01]*2[01]*)+)(?![^])/,
    lineBreaks: true
  },
  invalido: { match: /[^]+/, lineBreaks: true }
})

const lexer4 = moo.compile({
  invalido: {
    match: /(?:(?:[01]*[^01][01]*)+|[01]{1,4}|[01]*(?:00000|00001|00010|00100|01000|10000|11000|10100|10010|10001|01100|01010|01001|00110|00101|00011)[01]*)(?![^])/,
    lineBreaks: true
  },
  valido: /.+/
})

const lexer5 = moo.compile({
  ID: {
    match: /[a-zA-Z](?:[a-zA-Z]|[0-9])*/,
    type: moo.keywords({
      PROGRAM: 'program',
      VAR: 'var',
      INT: 'int',
      REAL: 'real'
    })
  },
  CTREAL: {
    match: /[0-9]+\.[0-9]*/,
    value: text => (parseFloat(text) as unknown) as string
  },
  CTINT: {
    match: /[0-9]+/,
    value: text => (parseInt(text, 10) as unknown) as string
  },
  add_sub: {
    match: /-|\+/,
    type: _ => 'OPAD',
    value: text => (text === '+' ? 'MAIS' : 'MENOS')
  },
  mult_div: {
    match: /\*|\//,
    type: _ => 'OPMULT',
    value: text => (text === '*' ? 'VEZES' : 'DIV')
  },
  ABPAR: {
    match: /\(/,
    value: empty_string
  },
  FPAR: {
    match: /\)/,
    value: empty_string
  },
  ABCHAV: {
    match: /\{/,
    value: empty_string
  },
  FCHAV: {
    match: /\}/,
    value: empty_string
  },
  ATRIB: {
    match: /=/,
    value: empty_string
  },
  VIRG: {
    match: /,/,
    value: empty_string
  },
  PVIRG: {
    match: /;/,
    value: empty_string
  },
  WHITESPACE: {
    match: /\s+/,
    lineBreaks: true,
    value: empty_string
  },
  INVALIDO: /./
})

export function predicate1(inputstring: string) {
  if (inputstring === '') {
    return true
  }
  lexer1.reset(inputstring)
  return lexer1.next().type === 'valido'
}

export function predicate2(inputstring: string) {
  if (inputstring === '') {
    return false
  }
  lexer2.reset(inputstring)
  return lexer2.next().type === 'valido'
}

export function predicate3(inputstring: string) {
  if (inputstring === '') {
    return true
  }
  lexer3.reset(inputstring)
  return lexer3.next().type === 'valido'
}

export function predicate4(inputstring: string) {
  if (inputstring === '') {
    return false
  }
  lexer4.reset(inputstring)
  return lexer4.next().type === 'valido'
}

export function lex5(inputstring: string) {
  const tokens: { Texto: string, Tipo: string, Atributo: string }[] = []
  lexer5.reset(inputstring)
  let token
  while ((token = lexer5.next()) !== undefined) {
    if (token.type === 'WHITESPACE') {
      continue
    }
    tokens.push({
      Texto: token.text,
      Tipo: token.type,
      Atributo: token.value
    })
  }
  return tokens
}

expose_global('lexer1', lexer1)
expose_global('lexer2', lexer2)
expose_global('lexer3', lexer3)
expose_global('lexer4', lexer4)
expose_global('lexer5', lexer5)

expose_global('predicate1', predicate1)
expose_global('predicate2', predicate2)
expose_global('predicate3', predicate3)
expose_global('predicate4', predicate4)
