import moo = require('moo')
import { empty_string } from '../common';

const letra_regexp = '[a-zA-Z]'
const digit_regexp = '[0-9]'
const carac1_regexp = '(?:\\\\.|[^\\\\\'\n])'
const carac2_regexp = '(?:\\\\.|[^\\\\"\n])'

function characterEscape(source: string): string {
  let result: string = ''
  for (let i = 0; i < source.length; i++) {
    let char = source[i]
    if (char !== `\\`) {
      result += char
      continue
    }

    char = source[++i]
    const charCode: number = {
      'a': 0x07,
      'b': 0x08,
      'e': 0x1b,
      'f': 0x0c,
      'n': 0x0a,
      'r': 0x0d,
      't': 0x09,
      'v': 0x0b,
      '\\': 0x5c,
      '\'': 0x27,
      '"': 0x22,
      '?': 0x3f,
      '0': 0x00,
      '1': 0x01,
      '2': 0x02,
      '3': 0x03,
      '4': 0x04,
      '5': 0x05,
      '6': 0x06,
      '7': 0x07,
      '8': 0x08,
      '9': 0x09
    }[char]
    result += String.fromCharCode(charCode)
  }

  return result
}

const lexer = moo.compile({
  COMENTARIO: {
    match: /\/\*[^]*?\*\//,
    lineBreaks: true,
    value: empty_string
  },
  ID: {
    match: new RegExp(`${letra_regexp}(?:${letra_regexp}|${digit_regexp})*`),
    type: moo.keywords({
      CALL: 'call',
      FOR: 'for',
      LOGIC: 'logic',
      TRUE: 'true',
      CHAR: 'char',
      FUNCTIONS: 'functions',
      MAIN: 'main',
      VOID: 'void',
      DO: 'do',
      GLOBAL: 'global',
      PROGRAM: 'program',
      WHILE: 'while',
      ELSE: 'else',
      IF: 'if',
      READ: 'read',
      WRITE: 'write',
      FALSE: 'false',
      INT: 'int',
      RETURN: 'return',
      FLOAT: 'float',
      LOCAL: 'local',
      STATEMENTS: 'statements'
    })
  },
  FLOATCT: {
    match: new RegExp(`${digit_regexp}+\\.${digit_regexp}*(?:(?:E|e)(?:\\+|-)?${digit_regexp}+)?`),
    value: text => (parseFloat(text) as unknown) as string
  },
  INTCT: {
    match: new RegExp(`${digit_regexp}+`),
    value: text => (parseInt(text, 10) as unknown) as string
  },
  CHARCT: {
    match: new RegExp(`'${carac1_regexp}'`),
    value: text => characterEscape(text.slice(1, -1)) // descarta os sinais de apóstrofe (primeira e última posições)
  },
  STRING: {
    match: new RegExp(`"(?:${carac2_regexp})*?"`),
    value: text => characterEscape(text.slice(1, -1)) // descarta os sinais de aspas (primeira e última posições)
  },
  OR: {
    match: /\|\|/,
    value: empty_string
  },
  AND: {
    match: /&&/,
    value: empty_string
  },
  RELOP: {
    match: /<(?!=|-)|<=|>(?!=)|>=|=|!=/,
    value: text => ({
      '<': 'LT',
      '<=': 'LE',
      '>': 'GT',
      '>=': 'GE',
      '=': 'EQ',
      '!=': 'NE'
    }[text])
  },
  NOT: {
    match: /!/,
    value: empty_string
  },
  ADOP: {
    match: /\+|-/,
    value: text => ({
      '+': 'MAIS',
      '-': 'MENOS'
    }[text])
  },
  MULTOP: {
    match: /\*|\/|%/,
    value: text => ({
      '*': 'VEZES',
      '/': 'DIV',
      '%': 'RESTO'
    }[text])
  },
  NEG: {
    match: /~/,
    value: empty_string
  },
  ASSIGN: {
    match: /<-/,
    value: empty_string
  },
  OPPAR: {
    match: /\(/,
    value: empty_string
  },
  CLPAR: {
    match: /\)/,
    value: empty_string
  },
  OPBRAK: {
    match: /\[/,
    value: empty_string
  },
  CLBRAK: {
    match: /\]/,
    value: empty_string
  },
  OPBRACE: {
    match: /\{/,
    value: empty_string
  },
  CLBRACE: {
    match: /\}/,
    value: empty_string
  },
  SCOLON: {
    match: /;/,
    value: empty_string
  },
  COMMA: {
    match: /,/,
    value: empty_string
  },
  COLON: {
    match: /:/,
    value: empty_string
  },
  WHITESPACE: {
    match: /\s+/,
    lineBreaks: true,
    value: empty_string
  },
  INVALIDO: /./
})

lexer.next = (next => () => {
  let tok;
  while ((tok = next.call(lexer)) &&
    (tok.type === "WHITESPACE" || tok.type === "COMENTARIO")) { }
  return tok;
})(lexer.next);

export { lexer }

export function lex(inputstring: string) {
  const tokens: { Texto: string, Tipo: string, Atributo: string }[] = []
  lexer.reset(inputstring)
  let token
  while ((token = lexer.next()) !== undefined) {
    tokens.push({
      Texto: token.text,
      Tipo: token.type,
      Atributo: token.value
    })
  }
  return tokens
}
