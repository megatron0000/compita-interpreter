/**
 * Testes efêmeros
 */

import grammar = require('./verbosetree/grammar')
import nearley = require('nearley')
import { readFileSync } from 'fs'
import { TreeShake } from './verbosetree/algorithms';
import { ConvertToAST } from './conversion';
import { PrinterVisitor } from './visualization/printer';
import { Parse } from './verbosetree/parser';
import assert = require('assert')
import { FillSymbolTable, ResolveTypesInPlace } from './semantics/checkers';
import { Assemble } from './intermediate/assembler';

const tree = TreeShake(
  Parse(readFileSync(__dirname + '/../../programas-amostra/' + process.argv[2], 'utf8'))
)

// console.log(JSON.stringify(tree))
// console.log(JSON.stringify(ConvertToAST(tree)))



const [program, backmap] = ConvertToAST(tree, true)

let version1 = ''
let version2 = ''

function print1(...msg: string[]) {
  msg.forEach(msgi => {
    version1 += msgi + '\n'
  })
}

function print2(...msg: string[]) {
  msg.forEach(msgi => {
    version2 += msgi + '\n'
  })
}

new PrinterVisitor(print1, backmap).visitProgram(program)

const tree2 = TreeShake(Parse(version1))
const [program2, backmap2] = ConvertToAST(tree2, true)

new PrinterVisitor(print2, backmap2).visitProgram(program2)

assert.equal(version1, version2)

console.log(version2)

const [symbolTable, errors] = new FillSymbolTable().execute(program2)

errors.push(...new ResolveTypesInPlace().execute(program2, symbolTable))

console.log(errors)

console.log(Assemble(program2))