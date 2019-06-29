import { Program, Typed, VariableType, Expression, For, While, Assignment, Statement } from "../abstracttree/definitions";
import { Instruction, InstructionKinds, InstructionOperandKinds, NOP, JNE } from "./definitions";
import { Listify, Flatten } from "../../common";

/**
 * 
 * @param program Must be (i) already free of semantical errors 
 * (ii) With all `resolvedType` fields filled
 */
export function Assemble(program: Resolved<Program>) {

}

type Resolved<T> = T extends Typed
  ? {
    [K in keyof T]: Resolved<T[K]>
  } & { resolvedType: VariableType }
  : {
    [K in keyof T]: Resolved<T[K]>
  }

function assertStructure<D>() {
  return <K extends string, T extends { [key: string]: K | K[] }, U>(structure: T, object: U) => {
    for (let key of Object.keys(structure)) {
      if (!object[key] || !object[key].kind || Listify(structure[key]).indexOf(object[key].kind) === -1) {
        throw new Error('Expected ' + object + ' to have key ' + key + ' with value-kind ' + structure[key])
      }
    }
    return object as U & { [key in keyof T]: T[key] extends keyof D
      ? D[T[key]]
      : T[key] extends (infer K)[]
      ? K extends keyof D
      ? D[K]
      : never
      : never
    }
  }
}

const assertKind = assertStructure<InstructionKinds & InstructionOperandKinds>()

class Assembler {
  constructor(private program: Resolved<Program>) { }

  assembleFor(forNode: For): Instruction[] {
    const equivalentWhile: While = {
      kind: 'while',
      condition: forNode.condition,
      body: forNode.body.concat(forNode.increment)
    }

    return this.assembleAssignment(forNode.initializer).concat(this.assembleWhile(equivalentWhile))
  }

  assembleWhile(whileNode: While): Instruction[] {
    const conditionExpression = this.assembleExpression(whileNode.condition)
    const lastConditionInstruction = assertKind(
      { destination: ['absolute address', 'relative address'] },
      conditionExpression[conditionExpression.length - 1]
    )
    const bodyExpression = Flatten(whileNode.body.map(x => this.assembleStatement(x)))
    const finalBodyNOP: NOP = { kind: 'NOP' }
    bodyExpression.push(finalBodyNOP)
    const initialBodyTest: JNE = {
      kind: 'JNE',
      test: lastConditionInstruction.destination,
      address: { kind: 'relative address', relativeTo: 'EIP', displacement: bodyExpression.length - 1 }
    }
    bodyExpression.unshift(initialBodyTest)
  }

  assembleAssignment(assignmentNode: Assignment): Instruction[] {
    
  }

  assembleExpression(expressionNode: Expression): Instruction[] {

  }

  assembleStatement(statementNode: Statement): Instruction[] {

  }
}