/**
 * Disponibiliza um parser para a linguagem COMPITA2019, que produz
 * a "verbose tree" da linguagem
 */

import nearley = require('nearley')
import grammar = require('./grammar')



export const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))

