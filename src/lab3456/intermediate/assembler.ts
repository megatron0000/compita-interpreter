// procedures for converting a COMPITA-2019 AST into a sequence of Instructions

import { Program, VariableType, Expression, For, While, Assignment, Statement, Identifier, IFunction, Addition, Subtraction, Multiplication, Division, Modulus, Negation, LogicalNOT, LogicalOR, LogicalAND, LessThan, LessOrEqual, GreaterThan, Equal, GreaterOrEqual, NotEqual, IdentifierReference, If, Do, Read, Write, FunctionCall, Return, IBoolean, Float, Char, Int } from "../abstracttree/definitions";
import { Instruction, JNE, MemoryAddress, MOV, ADD, PUSH, SUB, MULT, DIV, MOD, POP, NEG, NOT, OR, AND, CLT, CLE, CGT, CGE, CEQ, CNE, JMP, JEQ, READ, WRITE, ASS, CALL, RET, CAST, HALT } from "./definitions";
import { Flatten, assertNotNull, repeatList } from "../../common";
import { SymbolName } from "../semantics/symboltable";

/**
 * 
 * @param program Must be already free of semantical errors 
 */
export function Assemble(program: Program) {
  return new ProgramAssembler().assembleProgram(program)
}

interface SymbolRuntimeInfo {
  identifier: Identifier
  baseAddress: MemoryAddress
}

class ProgramAssembler {
  assembleProgram(programNode: Program): Instruction[] {
    const result: Instruction[] = []
    const globalSymbolInfo: Map<string, SymbolRuntimeInfo> = new Map()

    // assemble global variable declarations and keep track of their
    // base addresses
    let displacement = 0
    programNode.declarations.forEach(declaration => {
      const totalMemory = declaration.identifier.dimensions.reduce((previous, current) => previous * current, 1)
      displacement -= totalMemory
      globalSymbolInfo.set(declaration.identifier.name, {
        identifier: declaration.identifier,
        baseAddress: { kind: 'relative address', relativeTo: 'EHM', displacement }
      })
      result.push(...repeatList(<PUSH>{ kind: 'PUSH', content: { kind: 'immediate', type: declaration.type, value: 0 } }, totalMemory))
    })

    // note function addresses
    // but still not fill the values, because every function must be assembled first
    programNode.functions.forEach(funcNode => {
      const funcName = SymbolName(funcNode)
      displacement--
      globalSymbolInfo.set(funcName, {
        // not really an identifier, but let us trick the clients of this object anyway
        identifier: { kind: 'identifier', name: funcName, dimensions: [], subscripted: false, type: 'void' },
        baseAddress: { kind: 'relative address', relativeTo: 'EHM', displacement }
      })
    })

    // note that we will assemble call to main function and HALT
    displacement -= 2

    // assemble functions and push their addresses (all addresses first)
    let functionAddress = result.length + programNode.functions.length + /**CALL + HALT */2
    const functionAssembles = programNode.functions.map(funcNode => {
      result.push(<PUSH>{ kind: 'PUSH', content: { kind: 'immediate', type: 'int', value: functionAddress } })
      const assemble = new FunctionAssembler(globalSymbolInfo).assembleFunction(funcNode)
      functionAddress += assemble.length
      return assemble
    })

    result.push(<CALL>{ kind: 'CALL', callAddress: assertNotNull(globalSymbolInfo.get('main')).baseAddress })
    result.push(<HALT>{ kind: 'HALT' })

    // push all function assembles
    result.push(...Flatten(functionAssembles))

    return result
  }
}

class FunctionAssembler {
  constructor(private symbolInfo: Map<string, SymbolRuntimeInfo>) { }

  assembleFunction(functionNode: IFunction): Instruction[] {
    const result: Instruction[] = []
    const funcScopeSymbolInfo = new Map(this.symbolInfo)


    // prologue
    result.push(
      <PUSH>{ kind: 'PUSH', content: { kind: 'register', name: 'EBP' } },
      <MOV>{ kind: 'MOV', source: { kind: 'register', name: 'ESP' }, destination: { kind: 'register', name: 'EBP' } }
    )

    // register base addresses of arguments
    if (functionNode.kind === 'function') {
      functionNode.arguments.forEach((arg, index) => funcScopeSymbolInfo.set(arg.name, {
        identifier: arg,
        baseAddress: { kind: 'relative address', relativeTo: 'EBP', displacement: 1 + (functionNode.arguments.length - index) }
      }))
    }

    // assemble local variable declarations and keep track of their
    // base addresses
    let displacement = 0
    functionNode.declarations.forEach(declaration => {
      const totalMemory = declaration.identifier.dimensions.reduce((previous, current) => previous * current, 1)
      displacement -= totalMemory
      funcScopeSymbolInfo.set(declaration.identifier.name, {
        identifier: declaration.identifier,
        baseAddress: { kind: 'relative address', relativeTo: 'EBP', displacement }
      })
      result.push(...repeatList(<PUSH>{ kind: 'PUSH', content: { kind: 'immediate', type: declaration.type, value: 0 } }, totalMemory))
    })

    result.push(...Flatten(functionNode.statements.map(x => new StatementAssembler(funcScopeSymbolInfo).assembleStatement(x))))

    result.push(...new StatementAssembler(funcScopeSymbolInfo).assembleReturn({ kind: 'return', resolvedType: 'int' }))

    return result
  }

}

class StatementAssembler {
  /**
   * @param symbolInfo Should map any symbol name appearing in the function's body to a 
   * correct `SymbolRuntimeInfo` object (so as to allow querying the symbol's base memory address)
   */
  constructor(private symbolInfo: Map<string, SymbolRuntimeInfo>) { }

  assembleIf(ifNode: If): Instruction[] {
    const bodyStatements = Flatten(ifNode.ifBody.map(x => this.assembleStatement(x)))
    const elseStatements = Flatten(ifNode.elseBody.map(x => this.assembleStatement(x)))
    const conditionExpression = new ExpressionAssembler(this.symbolInfo).assembleExpression(ifNode.condition)

    return [
      ...conditionExpression,
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R1' } },
      <ADD>{
        kind: 'ADD',
        op1: { kind: 'register', name: 'EIP' },
        op2: { kind: 'immediate', type: 'int', value: bodyStatements.length + 3 },
        destination: { kind: 'register', name: 'R2' }
      },
      <JEQ>{
        kind: 'JEQ',
        test: { kind: 'register', name: 'R1' },
        jumpAddress: { kind: 'register', name: 'R2' }
      },
      ...bodyStatements,
      <ADD>{
        kind: 'ADD',
        op1: { kind: 'register', name: 'EIP' },
        op2: { kind: 'immediate', type: 'int', value: elseStatements.length + 1 },
        destination: { kind: 'register', name: 'R2' }
      },
      <JMP>{
        kind: 'JMP',
        jumpAddress: { kind: 'register', name: 'R2' }
      },
      ...elseStatements
    ]
  }

  assembleWhile(whileNode: While): Instruction[] {
    const conditionExpression = [
      ...new ExpressionAssembler(this.symbolInfo).assembleExpression(whileNode.condition),
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R1' } }
    ]
    const bodyExpression = Flatten(whileNode.body.map(x => this.assembleStatement(x)))
    const initialBodyTest = [
      <ADD>{
        kind: 'ADD',
        op1: { kind: 'register', name: 'EIP' },
        op2: { kind: 'immediate', type: 'int', value: 1 + (bodyExpression.length + 2) },
        destination: { kind: 'register', name: 'R2' }
      },
      <JEQ>{
        kind: 'JEQ',
        test: { kind: 'register', name: 'R1' },
        jumpAddress: { kind: 'register', name: 'R2' }
      }
    ]
    bodyExpression.push(
      <ADD>{
        kind: 'ADD',
        op1: { kind: 'register', name: 'EIP' },
        op2: {
          kind: 'immediate', type: 'int', value: - (1 + bodyExpression.length + initialBodyTest.length + conditionExpression.length),
        },
        destination: { kind: 'register', name: 'R2' }
      },
      <JMP>{
        kind: 'JMP',
        jumpAddress: { kind: 'register', name: 'R2' }
      }
    )
    return [
      ...conditionExpression,
      ...initialBodyTest,
      ...bodyExpression
    ]
  }

  assembleDo(doNode: Do): Instruction[] {
    const bodyStatements = Flatten(doNode.body.map(x => this.assembleStatement(x)))
    const conditionExpression = new ExpressionAssembler(this.symbolInfo).assembleExpression(doNode.condition)
    return [
      ...bodyStatements,
      ...conditionExpression,
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R1' } },
      <ADD>{
        kind: 'ADD',
        op1: { kind: 'register', name: 'EIP' },
        op2: { kind: 'immediate', type: 'int', value: -2 - bodyStatements.length - conditionExpression.length },
        destination: { kind: 'register', name: 'R2' }
      },
      <JNE>{
        kind: 'JNE',
        test: { kind: 'register', name: 'R1' },
        jumpAddress: { kind: 'register', name: 'R2' }
      }
    ]
  }

  assembleFor(forNode: For): Instruction[] {
    const equivalentWhile: While = {
      kind: 'while',
      condition: forNode.condition,
      body: [...forNode.body, forNode.increment]
    }

    return [
      ...this.assembleAssignment(forNode.initializer),
      ...this.assembleWhile(equivalentWhile)
    ]
  }

  assembleRead(readNode: Read): Instruction[] {
    return Flatten(readNode.receptors.map(receptor => [
      ...new VectorIndexingAssembler(this.symbolInfo).assembleIndexing(receptor),
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R1' } },
      <READ>{ kind: 'READ', destination: { kind: 'relative address', relativeTo: 'R1', displacement: 0 } }
    ]))
  }

  assembleWrite(writeNode: Write): Instruction[] {
    return Flatten(writeNode.sources.map(source => {
      if (source.kind === 'string') {
        return source.value.split('').map(char =>
          (<WRITE>{ kind: 'WRITE', source: { kind: 'immediate', value: char.charCodeAt(0), type: 'char' } })
        )
      }

      const expression = new ExpressionAssembler(this.symbolInfo).assembleExpression(source)
      return [
        ...expression,
        <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R1' } },
        <WRITE>{ kind: 'WRITE', source: { kind: 'register', name: 'R1' } }
      ]
    }))
  }

  assembleAssignment(assignmentNode: Assignment): Instruction[] {
    const expression = new ExpressionAssembler(this.symbolInfo).assembleExpression(assignmentNode.rightSide)
    const destination = new VectorIndexingAssembler(this.symbolInfo).assembleIndexing(assignmentNode.leftSide)
    return [
      ...expression,
      ...destination,
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R1' } },
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R2' } },
      <ASS>{ kind: 'ASS', source: { kind: 'register', name: 'R2' }, destination: { kind: 'relative address', relativeTo: 'R1', displacement: 0 } }
    ]
  }

  assembleFunctionCall(funcCallNode: FunctionCall): Instruction[] {
    const args = Flatten(funcCallNode.arguments.map(arg => new ExpressionAssembler(this.symbolInfo).assembleExpression(arg)))
    return [
      ...args,
      <CALL>{ kind: 'CALL', callAddress: assertNotNull(this.symbolInfo.get(funcCallNode.name)).baseAddress },
      ...repeatList(<POP>{ kind: 'POP', destination: { kind: 'register', name: 'R0' } }, funcCallNode.arguments.length)
    ]
  }

  /**
   * Create the function "epilogue" as well
   */
  assembleReturn(returnNode: Return): Instruction[] {
    const expressions = returnNode.body
      ? new ExpressionAssembler(this.symbolInfo).assembleExpression(returnNode.body)
      : [<PUSH>{ kind: 'PUSH', content: { kind: 'immediate', value: -1, type: 'int' } }]
    const returnType = (x => x === 'void' ? 'int' : x)(assertNotNull(returnNode.resolvedType))

    return [
      ...expressions,
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'ERV' } },
      <CAST>{ kind: 'CAST', where: { kind: 'register', name: 'ERV' }, type: returnType },
      <MOV>{ kind: 'MOV', source: { kind: 'register', name: 'EBP' }, destination: { kind: 'register', name: 'ESP' } },
      <POP>{ kind: 'POP', destination: { kind: 'register', name: 'EBP' } },
      <RET>{ kind: 'RET' }
    ]
  }

  assembleStatement(statementNode: Statement): Instruction[] {
    switch (statementNode.kind) {
      case 'if':
        return this.assembleIf(statementNode)
      case 'while':
        return this.assembleWhile(statementNode)
      case 'do':
        return this.assembleDo(statementNode)
      case 'for':
        return this.assembleFor(statementNode)
      case 'read':
        return this.assembleRead(statementNode)
      case 'write':
        return this.assembleWrite(statementNode)
      case 'function call':
        return this.assembleFunctionCall(statementNode)
      case 'return':
        return this.assembleReturn(statementNode)
      case 'assignment':
        return this.assembleAssignment(statementNode)
    }
  }
}

/**
 * All methods leave their result on top of the runtime stack
 */
class ExpressionAssembler {
  constructor(private symbolInfo: Map<string, SymbolRuntimeInfo>) { }

  assembleExpression(expressionNode: Expression): Instruction[] {
    switch (expressionNode.kind) {
      case 'addition':
        return this.assembleAddition(expressionNode)
      case 'subtraction':
        return this.assembleSubtraction(expressionNode)
      case 'multiplication':
        return this.assembleMultiplication(expressionNode)
      case 'division':
        return this.assembleDivision(expressionNode)
      case 'modulus':
        return this.assembleModulus(expressionNode)
      case 'negation':
        return this.assembleNegation(expressionNode)
      case 'not':
        return this.assembleLogicalNOT(expressionNode)
      case 'or':
        return this.assembleLogicalOR(expressionNode)
      case 'and':
        return this.assembleLogicalAND(expressionNode)
      case 'less than':
        return this.assembleLessThan(expressionNode)
      case 'less or equal':
        return this.assembleLessOrEqual(expressionNode)
      case 'greater than':
        return this.assembleGreaterThan(expressionNode)
      case 'greater or equal':
        return this.assembleGreaterOrEqual(expressionNode)
      case 'equal':
        return this.assembleEqual(expressionNode)
      case 'not equal':
        return this.assembleNotEqual(expressionNode)
      case 'function call':
        return this.assembleFunctionCall(expressionNode)
      case 'identifier reference':
        return this.assembleIdentifierReference(expressionNode)
      case 'boolean': case 'character': case 'float': case 'integer':
        return this.assembleConstant(expressionNode)
    }
  }

  assembleAddition(additionNode: Addition): Instruction[] {
    const leftInsts = this.assembleExpression(additionNode.leftSide)
    const rightInsts = this.assembleExpression(additionNode.rightSide)
    const addInst: ADD = {
      kind: 'ADD',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      addInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleSubtraction(subtractionNode: Subtraction): Instruction[] {
    const leftInsts = this.assembleExpression(subtractionNode.leftSide)
    const rightInsts = this.assembleExpression(subtractionNode.rightSide)
    const subInst: SUB = {
      kind: 'SUB',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      subInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleMultiplication(multiplicationNode: Multiplication): Instruction[] {
    const leftInsts = this.assembleExpression(multiplicationNode.leftSide)
    const rightInsts = this.assembleExpression(multiplicationNode.rightSide)
    const multInst: MULT = {
      kind: 'MULT',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      multInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleDivision(divisionNode: Division): Instruction[] {
    const leftInsts = this.assembleExpression(divisionNode.leftSide)
    const rightInsts = this.assembleExpression(divisionNode.rightSide)
    const divInst: DIV = {
      kind: 'DIV',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      divInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleModulus(modulusNode: Modulus): Instruction[] {
    const leftInsts = this.assembleExpression(modulusNode.leftSide)
    const rightInsts = this.assembleExpression(modulusNode.rightSide)
    const modInst: MOD = {
      kind: 'MOD',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      modInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleNegation(negationNode: Negation): Instruction[] {
    const opInsts = this.assembleExpression(negationNode.target)
    const negInst: NEG = {
      kind: 'NEG',
      op: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...opInsts,
      negInst,
      popInst,
      pushInst
    ]
  }

  assembleLogicalNOT(notNode: LogicalNOT): Instruction[] {
    const opInsts = this.assembleExpression(notNode.target)
    const notInst: NOT = {
      kind: 'NOT',
      op: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...opInsts,
      notInst,
      popInst,
      pushInst
    ]
  }

  assembleLogicalOR(orNode: LogicalOR): Instruction[] {
    const leftInsts = this.assembleExpression(orNode.leftSide)
    const rightInsts = this.assembleExpression(orNode.rightSide)
    const orInst: OR = {
      kind: 'OR',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      orInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleLogicalAND(andNode: LogicalAND): Instruction[] {
    const leftInsts = this.assembleExpression(andNode.leftSide)
    const rightInsts = this.assembleExpression(andNode.rightSide)
    const andInst: AND = {
      kind: 'AND',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      andInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleLessThan(lessThanNode: LessThan): Instruction[] {
    const leftInsts = this.assembleExpression(lessThanNode.leftSide)
    const rightInsts = this.assembleExpression(lessThanNode.rightSide)
    const cmpLessInst: CLT = {
      kind: 'CLT',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      cmpLessInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleLessOrEqual(lessOrEqualNode: LessOrEqual): Instruction[] {
    const leftInsts = this.assembleExpression(lessOrEqualNode.leftSide)
    const rightInsts = this.assembleExpression(lessOrEqualNode.rightSide)
    const cmpLessEqualInst: CLE = {
      kind: 'CLE',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      cmpLessEqualInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleGreaterThan(greaterThanNode: GreaterThan): Instruction[] {
    const leftInsts = this.assembleExpression(greaterThanNode.leftSide)
    const rightInsts = this.assembleExpression(greaterThanNode.rightSide)
    const cmpGreaterInst: CGT = {
      kind: 'CGT',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      cmpGreaterInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleGreaterOrEqual(greaterOrEqualNode: GreaterOrEqual): Instruction[] {
    const leftInsts = this.assembleExpression(greaterOrEqualNode.leftSide)
    const rightInsts = this.assembleExpression(greaterOrEqualNode.rightSide)
    const cmpGreaterEqualInst: CGE = {
      kind: 'CGE',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      cmpGreaterEqualInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleEqual(equalNode: Equal): Instruction[] {
    const leftInsts = this.assembleExpression(equalNode.leftSide)
    const rightInsts = this.assembleExpression(equalNode.rightSide)
    const cmpEqualInst: CEQ = {
      kind: 'CEQ',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      cmpEqualInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleNotEqual(notEqualNode: NotEqual): Instruction[] {
    const leftInsts = this.assembleExpression(notEqualNode.leftSide)
    const rightInsts = this.assembleExpression(notEqualNode.rightSide)
    const cmpNotEqualInst: CNE = {
      kind: 'CNE',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 1 },
      op2: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      destination: { kind: 'register', name: 'R1' }
    }
    const pushInst: PUSH = {
      kind: 'PUSH',
      content: { kind: 'register', name: 'R1' }
    }
    const popInst: POP = {
      kind: 'POP',
      destination: { kind: 'register', name: 'R0' }
    }
    return [
      ...leftInsts,
      ...rightInsts,
      cmpNotEqualInst,
      popInst,
      popInst,
      pushInst
    ]
  }

  assembleIdentifierReference(idRefNode: IdentifierReference): Instruction[] {
    const indexInstructions = new VectorIndexingAssembler(this.symbolInfo).assembleIndexing(idRefNode)
    return [
      ...indexInstructions,
      <POP>{
        kind: 'POP',
        destination: { kind: 'register', name: 'R1' }
      },
      <PUSH>{
        kind: 'PUSH',
        content: { kind: 'relative address', relativeTo: 'R1', displacement: 0 }
      }
    ]
  }

  assembleFunctionCall(funcCallNode: FunctionCall): Instruction[] {
    const args = Flatten(funcCallNode.arguments.map(arg => new ExpressionAssembler(this.symbolInfo).assembleExpression(arg)))
    return [
      ...args,
      <CALL>{ kind: 'CALL', callAddress: assertNotNull(this.symbolInfo.get(funcCallNode.name)).baseAddress },
      ...repeatList(<POP>{ kind: 'POP', destination: { kind: 'register', name: 'R0' } }, funcCallNode.arguments.length),
      <PUSH>{ kind: 'PUSH', content: { kind: 'register', name: 'ERV' } }
    ]
  }

  assembleConstant(constantNode: IBoolean | Float | Char | Int) {
    let type: VariableType = 'void'
    let value: number = 0
    switch (constantNode.kind) {
      case 'boolean':
        type = 'logic'
        value = constantNode.value === true ? 1 : 0
        break
      case 'float':
        type = 'float'
        value = constantNode.value
        break
      case 'character':
        type = 'char'
        value = constantNode.intValue
        break
      case 'integer':
        type = 'int'
        value = constantNode.value
        break
    }

    return [
      <PUSH>{ kind: 'PUSH', content: { kind: 'immediate', type, value } }
    ]
  }

}

/**
 * Leaves the result on top of the runtime stack
 */
class VectorIndexingAssembler {
  constructor(private symbolInfo: Map<string, SymbolRuntimeInfo>) { }

  /**
   * Leaves the resulting memory address on top of the stack. This address is always absolute
   */
  assembleIndexing(referenceNode: IdentifierReference): Instruction[] {
    const symbol = assertNotNull(this.symbolInfo.get(referenceNode.name))
    let result: Instruction[] = []

    result.push(<PUSH>{ kind: 'PUSH', content: { kind: 'immediate', type: 'int', value: 0 } })

    // calculate offset to base address
    for (let i = 0; i < referenceNode.subscripts.length; i++) {
      const subscript = referenceNode.subscripts[i]
      const nextDimension = symbol.identifier.dimensions[i + 1] || 1

      result.push(<MULT>{
        kind: 'MULT',
        op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
        op2: { kind: 'immediate', type: 'int', value: nextDimension },
        destination: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 }
      })

      result = result.concat(new ExpressionAssembler(this.symbolInfo).assembleExpression(subscript))

      result.push(
        <POP>{ kind: 'POP', destination: { kind: 'register', name: 'R1' } },
        <ADD>{
          kind: 'ADD',
          op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
          op2: { kind: 'register', name: 'R1' },
          destination: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 }
        }
      )
    }

    // finally add base address
    switch (symbol.baseAddress.kind) {
      case 'absolute address':
        result.push(
          <MOV>{
            kind: 'MOV',
            source: { kind: 'immediate', value: symbol.baseAddress.address, type: 'int' },
            destination: { kind: 'register', name: 'R1' }
          }
        )
        break
      case 'relative address':
        result.push(
          <ADD>{
            kind: 'ADD',
            op1: { kind: 'register', name: symbol.baseAddress.relativeTo },
            op2: { kind: 'immediate', type: 'int', value: symbol.baseAddress.displacement },
            destination: { kind: 'register', name: 'R1' }
          }
        )
        break
    }

    result.push(<ADD>{
      kind: 'ADD',
      op1: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 },
      op2: { kind: 'register', name: 'R1' },
      destination: { kind: 'relative address', relativeTo: 'ESP', displacement: 0 }
    })

    return result
  }


}