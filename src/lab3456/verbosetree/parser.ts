/**
 * Disponibiliza um parser para a linguagem COMPITA2019, que produz
 * a "verbose tree" da linguagem
 */

import nearley = require('nearley')
import grammar = require('./grammar')
import { SyntaxTree } from './definitions';

const ourGrammar = nearley.Grammar.fromCompiled(grammar)

export function Parse(code: string): SyntaxTree {
  const result = new nearley.Parser(ourGrammar).feed(code).results[0]

  if (!result) {
    throw new Error('Incomplete input')
  }

  return result
}