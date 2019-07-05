import { Instruction, ADD, InstructionOperand, AbsoluteMemoryAddress, RelativeMemoryAddress, Register, Immediate, AND, ASS, CALL, CAST, CEQ, CGE, CGT, CLE, CLT, CNE, DIV, HALT, JEQ, JMP, JNE, MOD, MOV, MULT, NEG, NOT, OR, POP, PUSH, READ, RET, SUB, WRITE, INV } from "./definitions";

/**
 * Dumps the instructions to a string format
 */
export function Serialize(program: Instruction[]): string {
  return program.map(x => new InstructionSerializer().serialize(x)).join('\n') + '\n'
}

class InstructionSerializer {
  serialize(instruction: Instruction): string {
    switch (instruction.kind) {
      case 'ADD':
        return this.serializeADD(instruction)
      case 'AND':
        return this.serializeAND(instruction)
      case 'ASS':
        return this.serializeASS(instruction)
      case 'CALL':
        return this.serializeCALL(instruction)
      case 'CAST':
        return this.serializeCAST(instruction)
      case 'CEQ':
        return this.serializeCEQ(instruction)
      case 'CGE':
        return this.serializeCGE(instruction)
      case 'CGT':
        return this.serializeCGT(instruction)
      case 'CLE':
        return this.serializeCLE(instruction)
      case 'CLT':
        return this.serializeCLT(instruction)
      case 'CNE':
        return this.serializeCNE(instruction)
      case 'DIV':
        return this.serializeDIV(instruction)
      case 'HALT':
        return this.serializeHALT(instruction)
      case 'INV':
        return this.serializeINV(instruction)
      case 'JEQ':
        return this.serializeJEQ(instruction)
      case 'JMP':
        return this.serializeJMP(instruction)
      case 'JNE':
        return this.serializeJNE(instruction)
      case 'MOD':
        return this.serializeMOD(instruction)
      case 'MOV':
        return this.serializeMOV(instruction)
      case 'MULT':
        return this.serializeMULT(instruction)
      case 'NEG':
        return this.serializeNEG(instruction)
      case 'NOT':
        return this.serializeNOT(instruction)
      case 'OR':
        return this.serializeOR(instruction)
      case 'POP':
        return this.serializePOP(instruction)
      case 'PUSH':
        return this.serializePUSH(instruction)
      case 'READ':
        return this.serializeREAD(instruction)
      case 'RET':
        return this.serializeRET(instruction)
      case 'SUB':
        return this.serializeSUB(instruction)
      case 'WRITE':
        return this.serializeWRITE(instruction)
    }
  }

  serializeADD(addInst: ADD) {
    return `${addInst.kind} ${
      new OperandSerializer().serialize(addInst.op1)
      } ${
      new OperandSerializer().serialize(addInst.op2)
      } ${
      new OperandSerializer().serialize(addInst.destination)
      }`
  }

  serializeAND(andInst: AND) {
    return `${andInst.kind} ${
      new OperandSerializer().serialize(andInst.op1)
      } ${
      new OperandSerializer().serialize(andInst.op2)
      } ${
      new OperandSerializer().serialize(andInst.destination)
      }`
  }

  serializeASS(assInst: ASS) {
    return `${assInst.kind} ${
      new OperandSerializer().serialize(assInst.source)
      } ${
      new OperandSerializer().serialize(assInst.destination)
      }`
  }

  serializeCALL(callInst: CALL) {
    return `${callInst.kind} ${
      new OperandSerializer().serialize(callInst.callAddress)
      }`
  }

  serializeCAST(castInst: CAST) {
    return `${castInst.kind} <${castInst.type}>0 ${new OperandSerializer().serialize(castInst.where)}`
  }

  serializeCEQ(ceqInst: CEQ) {
    return `${ceqInst.kind} ${
      new OperandSerializer().serialize(ceqInst.op1)
      } ${
      new OperandSerializer().serialize(ceqInst.op2)
      } ${
      new OperandSerializer().serialize(ceqInst.destination)
      }`
  }

  serializeCGE(cgeInst: CGE) {
    return `${cgeInst.kind} ${
      new OperandSerializer().serialize(cgeInst.op1)
      } ${
      new OperandSerializer().serialize(cgeInst.op2)
      } ${
      new OperandSerializer().serialize(cgeInst.destination)
      }`
  }

  serializeCGT(cgtInst: CGT) {
    return `${cgtInst.kind} ${
      new OperandSerializer().serialize(cgtInst.op1)
      } ${
      new OperandSerializer().serialize(cgtInst.op2)
      } ${
      new OperandSerializer().serialize(cgtInst.destination)
      }`
  }

  serializeCLE(cleInst: CLE) {
    return `${cleInst.kind} ${
      new OperandSerializer().serialize(cleInst.op1)
      } ${
      new OperandSerializer().serialize(cleInst.op2)
      } ${
      new OperandSerializer().serialize(cleInst.destination)
      }`
  }

  serializeCLT(cltInst: CLT) {
    return `${cltInst.kind} ${
      new OperandSerializer().serialize(cltInst.op1)
      } ${
      new OperandSerializer().serialize(cltInst.op2)
      } ${
      new OperandSerializer().serialize(cltInst.destination)
      }`
  }

  serializeCNE(cneInst: CNE) {
    return `${cneInst.kind} ${
      new OperandSerializer().serialize(cneInst.op1)
      } ${
      new OperandSerializer().serialize(cneInst.op2)
      } ${
      new OperandSerializer().serialize(cneInst.destination)
      }`
  }

  serializeDIV(divInst: DIV) {
    return `${divInst.kind} ${
      new OperandSerializer().serialize(divInst.op1)
      } ${
      new OperandSerializer().serialize(divInst.op2)
      } ${
      new OperandSerializer().serialize(divInst.destination)
      }`
  }

  serializeHALT(haltInst: HALT) {
    return `${haltInst.kind}`
  }

  serializeINV(invInst: INV) {
    return `${invInst.kind} ${
      new OperandSerializer().serialize(invInst.op)
      } ${
      new OperandSerializer().serialize(invInst.destination)
      }`
  }

  serializeJEQ(jeqInst: JEQ) {
    return `${jeqInst.kind} ${
      new OperandSerializer().serialize(jeqInst.test)
      } ${
      new OperandSerializer().serialize(jeqInst.jumpAddress)
      }`
  }

  serializeJMP(jmpInst: JMP) {
    return `${jmpInst.kind} ${new OperandSerializer().serialize(jmpInst.jumpAddress)}`
  }

  serializeJNE(jneInst: JNE) {
    return `${jneInst.kind} ${
      new OperandSerializer().serialize(jneInst.test)
      } ${
      new OperandSerializer().serialize(jneInst.jumpAddress)
      }`
  }

  serializeMOD(modInst: MOD) {
    return `${modInst.kind} ${
      new OperandSerializer().serialize(modInst.op1)
      } ${
      new OperandSerializer().serialize(modInst.op2)
      } ${
      new OperandSerializer().serialize(modInst.destination)
      }`
  }

  serializeMOV(movInst: MOV) {
    return `${movInst.kind} ${
      new OperandSerializer().serialize(movInst.source)
      } ${
      new OperandSerializer().serialize(movInst.destination)
      }`
  }

  serializeMULT(multInst: MULT) {
    return `${multInst.kind} ${
      new OperandSerializer().serialize(multInst.op1)
      } ${
      new OperandSerializer().serialize(multInst.op2)
      } ${
      new OperandSerializer().serialize(multInst.destination)
      }`
  }

  serializeNEG(negInst: NEG) {
    return `${negInst.kind} ${
      new OperandSerializer().serialize(negInst.op)
      } ${
      new OperandSerializer().serialize(negInst.destination)
      }`
  }

  serializeNOT(notInst: NOT) {
    return `${notInst.kind} ${
      new OperandSerializer().serialize(notInst.op)
      } ${
      new OperandSerializer().serialize(notInst.destination)
      }`
  }

  serializeOR(orInst: OR) {
    return `${orInst.kind} ${
      new OperandSerializer().serialize(orInst.op1)
      } ${
      new OperandSerializer().serialize(orInst.op2)
      } ${
      new OperandSerializer().serialize(orInst.destination)
      }`
  }

  serializePOP(popInst: POP) {
    return `${popInst.kind} ${
      new OperandSerializer().serialize(popInst.destination)
      }`
  }

  serializePUSH(pushInst: PUSH) {
    return `${pushInst.kind} ${
      new OperandSerializer().serialize(pushInst.content)
      }`
  }

  serializeREAD(readInst: READ) {
    return `${readInst.kind} ${
      new OperandSerializer().serialize(readInst.destination)
      }`
  }

  serializeRET(retInst: RET) {
    return `${retInst.kind}`
  }

  serializeSUB(subInst: SUB) {
    return `${subInst.kind} ${
      new OperandSerializer().serialize(subInst.op1)
      } ${
      new OperandSerializer().serialize(subInst.op2)
      } ${
      new OperandSerializer().serialize(subInst.destination)
      }`
  }

  serializeWRITE(writeInst: WRITE) {
    return `${writeInst.kind} ${
      new OperandSerializer().serialize(writeInst.source)
      }`
  }

}

class OperandSerializer {
  serialize(operand: InstructionOperand): string {
    switch (operand.kind) {
      case 'absolute address':
        return this.serializeAbsoluteAddress(operand)
      case 'relative address':
        return this.serializeRelativeAddress(operand)
      case 'register':
        return this.serializeRegister(operand)
      case 'immediate':
        return this.serializeImmediate(operand)
    }
  }

  serializeAbsoluteAddress(absAddress: AbsoluteMemoryAddress): string {
    return `M[${absAddress.address}]`
  }

  serializeRelativeAddress(relAddr: RelativeMemoryAddress): string {
    return `M[${relAddr.relativeTo}${relAddr.displacement < 0
      ? ' - ' + -relAddr.displacement
      : relAddr.displacement > 0
        ? ' + ' + relAddr.displacement
        : ''
      }]`
  }

  serializeRegister(register: Register): string {
    return `${register.name}`
  }

  serializeImmediate(immediate: Immediate): string {
    return `<${immediate.type}>${immediate.value}`
  }
}