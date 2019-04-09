/**
 * Testes efêmeros
 */

import grammar = require('./verbosetree/grammar')
import nearley = require('nearley')
import { readFileSync } from 'fs'
import { TreeShake } from './verbosetree/algorithms';
import { ConvertToAST } from './conversion';
import { PrinterVisitor } from './printer';

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
parser.feed(readFileSync(__dirname + '/../../programas-amostra/' + process.argv[2], 'utf8'))
const tree = parser.results[0]

TreeShake(tree)

// console.log(JSON.stringify(ConvertToAST(tree)))

new PrinterVisitor(console.log).visitProgram(ConvertToAST(tree))