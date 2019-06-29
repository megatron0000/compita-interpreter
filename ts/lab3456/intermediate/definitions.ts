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


interface AbsoluteMemoryAddress {
  kind: 'absolute address'
  address: number
}

interface RelativeMemoryAddress {
  kind: 'relative address'
  relativeTo: RegisterName
  displacement: number
}

type MemoryAddress = AbsoluteMemoryAddress | RelativeMemoryAddress

type RegisterName = 'EIP' | 'ESP' | 'EBP' | 'ERV'

interface Register {
  kind: 'register'
  name: RegisterName
}

interface Immediate {
  kind: 'immediate'
  value: number
  type: Exclude<VariableType, 'void'>
}

type InstructionOperand = Register | MemoryAddress | Immediate

export interface InstructionOperandKinds {
  'register': Register
  'immediate': Immediate
  'absolute address': AbsoluteMemoryAddress
  'relative address': RelativeMemoryAddress
}

export type Instruction = MOV | ADD | JNE | NOP

export interface InstructionKinds {
  'MOV': MOV
  'ADD': ADD
  'JNE': JNE
  'NOP': NOP
}

export interface WritefulInstruction {
  destination: Register | MemoryAddress
}

export interface MOV extends WritefulInstruction {
  kind: 'MOV'
  source: InstructionOperand
}

export interface ADD extends WritefulInstruction {
  kind: 'ADD'
  op1: InstructionOperand
  op2: InstructionOperand
}

/**
 * Jump if not equal to zero
 */
export interface JNE {
  kind: 'JNE'
  test: InstructionOperand
  /**
   * Where to jump to
   */
  address: MemoryAddress
}

export interface NOP {
  kind: 'NOP'
}