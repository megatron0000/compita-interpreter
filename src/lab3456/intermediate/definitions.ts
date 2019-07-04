// Type definitions for the assembly code (Instructions) generated
// when a COMPITA-2019 AST is "assembled"

import { VariableType } from "../abstracttree/definitions";

/**
 * Type of what a word in memory can be
 */
type MemoryWordType = 'char' | 'int' | 'float' | 'logic'

/**
 * A value stored in memory. It knows by itself the type of what is stored !
 */
interface MemoryWord {
  kind: MemoryWordType
  content: number
}

export interface AbsoluteMemoryAddress {
  kind: 'absolute address'
  address: number
}

export interface RelativeMemoryAddress {
  kind: 'relative address'
  relativeTo: RegisterName
  displacement: number
}

export type MemoryAddress = AbsoluteMemoryAddress | RelativeMemoryAddress

type RegisterName = 'EIP' | 'ESP' | 'EBP' | 'ERV' | 'EHM' | 'R0' | 'R1' | 'R2'

export interface Register {
  kind: 'register'
  name: RegisterName
}

export interface Immediate {
  kind: 'immediate'
  value: number
  type: Exclude<VariableType, 'void'>
}

export type InstructionOperand = Register | MemoryAddress | Immediate

export interface InstructionOperandKinds {
  'register': Register
  'immediate': Immediate
  'absolute address': AbsoluteMemoryAddress
  'relative address': RelativeMemoryAddress
}

export type Instruction = InstructionKinds[keyof InstructionKinds]

export interface InstructionKinds {
  'MOV': MOV
  'ASS': ASS
  'CAST': CAST
  'ADD': ADD
  'SUB': SUB
  'MULT': MULT
  'DIV': DIV
  'MOD': MOD
  'NEG': NEG
  'NOT': NOT
  'OR': OR
  'AND': AND
  'JMP': JMP
  'JNE': JNE
  'JEQ': JEQ
  'PUSH': PUSH
  'POP': POP
  'CLT': CLT
  'CLE': CLE
  'CGT': CGT
  'CGE': CGE
  'CEQ': CEQ
  'CNE': CNE
  'READ': READ
  'WRITE': WRITE
  'CALL': CALL
  'RET': RET
  'HALT': HALT
}


/**
 * Shorthand for "move". The destination's type is overwritten by
 * the source's type
 */
export interface MOV {
  kind: 'MOV'
  source: InstructionOperand
  destination: Register | MemoryAddress
}

/**
 * Shorthand for "assign". The difference from "MOV" is: 
 * The destination's type is *NOT* overwritten.
 */
export interface ASS {
  kind: 'ASS'
  source: InstructionOperand
  destination: Register | MemoryAddress
}

/**
 * Changes the type of `where` to `type`
 */
export interface CAST {
  kind: 'CAST'
  where: InstructionOperand
  type: Exclude<VariableType, 'void'>
}

export interface ADD {
  kind: 'ADD'
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface SUB {
  kind: 'SUB',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface MULT {
  kind: 'MULT',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface DIV {
  kind: 'DIV',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface MOD {
  kind: 'MOD'
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface NEG {
  kind: 'NEG'
  op: InstructionOperand
  destination: Register | MemoryAddress
}

export interface NOT {
  kind: 'NOT'
  op: InstructionOperand
  destination: Register | MemoryAddress
}

export interface OR {
  kind: 'OR',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface AND {
  kind: 'AND',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface CLT {
  kind: 'CLT',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface CLE {
  kind: 'CLE',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface CGT {
  kind: 'CGT',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface CGE {
  kind: 'CGE',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface CEQ {
  kind: 'CEQ',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface CNE {
  kind: 'CNE',
  op1: InstructionOperand
  op2: InstructionOperand
  destination: Register | MemoryAddress
}

export interface JMP {
  kind: 'JMP'
  jumpAddress: InstructionOperand
}

/**
 * Jump if not equal to zero
 */
export interface JNE {
  kind: 'JNE'
  test: InstructionOperand
  jumpAddress: InstructionOperand
}

export interface JEQ {
  kind: 'JEQ'
  test: InstructionOperand
  jumpAddress: InstructionOperand
}

export interface PUSH {
  kind: 'PUSH'
  content: InstructionOperand
}

export interface POP {
  kind: 'POP'
  destination: Register
}

export interface READ {
  kind: 'READ',
  destination: Register | MemoryAddress
}

export interface WRITE {
  kind: 'WRITE',
  source: InstructionOperand
}

export interface CALL {
  kind: 'CALL',
  callAddress: MemoryAddress
}

export interface RET {
  kind: 'RET'
}

/**
 * Makes the program exit
 */
export interface HALT {
  kind: 'HALT'
}