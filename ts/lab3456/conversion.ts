// Conversion procedures from verbose tree to abstract tree
// associated to COMPITA-2019

import { SyntaxTree, isToken, Token, castClass, castType, cast, isSyntaxTree } from "./verbosetree/definitions";
import { Program, Declaration, VariableType, IFunction, Statement, If, While, Do, For, Identifier, IdentifierReference, Read, Write, WriteSource, IString, Assignment, FunctionCall, Expression, Return, Int, Float, Char, IBoolean, LogicalOR, LogicalAND, Comparison, Negation, LogicalNOT, Subtraction, Addition, Multiplication, Division, Modulus } from "./abstracttree/definitions";

export function ConvertToAST(tree: SyntaxTree, backmap?: false): Program
export function ConvertToAST(tree: SyntaxTree, backmap: true): [Program, Backmap]
export function ConvertToAST(tree: SyntaxTree, backmap: boolean = false) {
  const converter = new BackmapConverter()
  const ast = converter.ConvertToAST(tree)
  if (backmap) {
    return [ast, converter.backmap]
  }
  return ast
}

export interface Backmap {
  parenthesizedInCode: Map<Expression, boolean>
}

type FunctionHeaderResult = {
  isMain: boolean
  returnType?: VariableType
  arguments?: Identifier[]
  name?: string
}

class Converter {
  ConvertToAST(tree: SyntaxTree): Program {
    const globDecls = cast('SyntaxTree', 'GlobDecls', tree.nodeChildren[3])
    const declList = globDecls.nodeChildren.length ? cast('SyntaxTree', 'DeclList', globDecls.nodeChildren[2]) : undefined
    return {
      kind: 'program',
      name: castClass('Token', tree.nodeChildren[1]).value,
      declarations: declList ? this.ParseDeclList(declList as SyntaxTree) : [],
      functions: this.ParseFunctionArray(
        cast('SyntaxTree', 'FuncList',
          cast('SyntaxTree', 'Functions', tree.nodeChildren[4]).nodeChildren[2]
        ).nodeChildren as SyntaxTree[]
      ),
    }
  }

  ParseDeclList(declListNode: SyntaxTree): Declaration[] {
    const result: Declaration[] = []

    declListNode.nodeChildren.forEach(decl => {
      decl = cast('SyntaxTree', 'Declaration', decl)

      const type = castClass('Token',
        cast('SyntaxTree', 'Type', decl.nodeChildren[0]).nodeChildren[0]
      ).text

      cast('SyntaxTree', 'ElemList', decl.nodeChildren[1]).nodeChildren.forEach(elem => {
        if (isToken(elem)) { // COMMA and SCOLON
          return
        }

        cast('SyntaxTree', 'Elem', elem)

        const name = cast('Token', 'ID', elem.nodeChildren[0]).value as string
        const dimensions: number[] = []

        // build dimensions
        cast('SyntaxTree', 'Dims', elem.nodeChildren[1]).nodeChildren.forEach(dim => {
          if (isToken(dim) && (dim.type === 'OPBRAK' || dim.type === 'CLBRAK')) {
            return
          }

          cast('SyntaxTree', 'DimList', dim).nodeChildren.forEach(numb => {
            if (isToken(numb) && numb.type === 'COMMA') {
              return
            }

            dimensions.push(cast('Token', 'INTCT', numb).value)
          })
        })

        result.push({
          kind: 'declaration',
          type: type as VariableType,
          identifier: {
            kind: 'identifier',
            name,
            dimensions,
            subscripted: dimensions.length !== 0,
            type: type as VariableType
          }
        })
      })
    })

    return result
  }

  ParseFunctionArray(functionNodes: SyntaxTree[]): IFunction[] {
    const result: IFunction[] = []

    functionNodes.forEach(fNode => {
      cast('SyntaxTree', 'Function', fNode)
      const headerNode = cast('SyntaxTree', 'Header', fNode.nodeChildren[0])
      cast('Token', 'OPBRACE', fNode.nodeChildren[1])
      const locDeclsNode = cast('SyntaxTree', 'LocDecls', fNode.nodeChildren[2])
      const statsNode = cast('SyntaxTree', 'Stats', fNode.nodeChildren[3])
      cast('Token', 'CLBRACE', fNode.nodeChildren[4])

      const headerInfo = this.ParseFunctionHeader(headerNode)
      const declarations = this.ParseLocDecls(locDeclsNode)
      const statements = this.ParseStats(statsNode)

      result.push(headerInfo.isMain ? {
        kind: 'main',
        declarations,
        statements
      } : {
          kind: 'function',
          declarations,
          statements,
          arguments: headerInfo.arguments as Identifier[],
          name: headerInfo.name as string,
          returnType: headerInfo.returnType as VariableType
        }
      )

    })

    return result
  }

  ParseFunctionHeader(headerNode: SyntaxTree): FunctionHeaderResult {
    const firstChild = headerNode.nodeChildren[0]
    if (isToken(firstChild)) {
      castType('MAIN', firstChild)
      return { isMain: true }
    }

    const returnType = castClass('Token', firstChild.nodeChildren[0]).text as VariableType
    const name = cast('Token', 'ID', headerNode.nodeChildren[1]).value
    cast('Token', 'OPPAR', headerNode.nodeChildren[2])
    const functionArguments = this.ParseParams(cast('SyntaxTree', 'Params', headerNode.nodeChildren[3]))

    return { isMain: false, returnType, arguments: functionArguments, name }
  }

  ParseParams(paramsNode: SyntaxTree): Identifier[] {
    const result: Identifier[] = []

    if (paramsNode.nodeChildren.length === 0) {
      return result
    }

    const paramListNode = cast('SyntaxTree', 'ParamList', paramsNode.nodeChildren[0])
    paramListNode.nodeChildren.forEach(parameterNode => {
      if (isToken(parameterNode)) {
        return castType('COMMA', parameterNode)
      }

      cast('SyntaxTree', 'Parameter', parameterNode)
      const argumentType = castClass('Token', cast('SyntaxTree', 'Type', parameterNode.nodeChildren[0]).nodeChildren[0]).text
      const argumentName = cast('Token', 'ID', parameterNode.nodeChildren[1]).value
      result.push({
        dimensions: [],
        kind: 'identifier',
        name: argumentName,
        subscripted: false,
        type: argumentType as VariableType
      })
    })

    return result
  }

  ParseLocDecls(locDeclsNode: SyntaxTree): Declaration[] {
    if (locDeclsNode.nodeChildren.length === 0) {
      return []
    }

    const children = locDeclsNode.nodeChildren
    cast('Token', 'LOCAL', children[0])
    cast('Token', 'COLON', children[1])
    const declListNode = cast('SyntaxTree', 'DeclList', children[2])

    const declarations = this.ParseDeclList(declListNode)

    return declarations
  }

  ParseStats(statsNode: SyntaxTree): Statement[] {
    const children = statsNode.nodeChildren
    cast('Token', 'STATEMENTS', children[0])
    cast('Token', 'COLON', children[1])
    const statList = cast('SyntaxTree', 'StatList', children[2])

    const statements = this.ParseStatList(statList)

    return statements
  }

  ParseStatList(statListNode: SyntaxTree): Statement[] {
    const result: Statement[] = []

    statListNode.nodeChildren.forEach(statementNode =>
      this.ParseStatement(cast('SyntaxTree', 'Statement', statementNode)).forEach(res => result.push(res))
    )

    return result
  }

  /**
   * A unique `Statement` node may contain no statements, 1 statement,
   * or more (if it contains a `CompStat` inside)
   */
  ParseStatement(statementNode: SyntaxTree): Statement[] {
    let child = statementNode.nodeChildren[0]

    if (isToken(child)) {
      castType('SCOLON', child)
      return []
    }

    child = castClass('SyntaxTree', child)

    switch (child.nodeName) {
      case 'CompStat': return this.ParseCompStat(child)
      case 'IfStat': return [this.ParseIfStat(child)]
      case 'WhileStat': return [this.ParseWhileStat(child)]
      case 'DoStat': return [this.ParseDoStat(child)]
      case 'ForStat': return [this.ParseForStat(child)]
      case 'ReadStat': return [this.ParseReadStat(child)]
      case 'WriteStat': return [this.ParseWriteStat(child)]
      case 'AssignStat': return [this.ParseAssignStat(child)]
      case 'CallStat': return [this.ParseCallStat(child)]
      case 'ReturnStat': return [this.ParseReturnStat(child)]
      default: throw new Error('Unrecognized child of Statement node')
    }


  }

  ParseCompStat(compStatNode: SyntaxTree): Statement[] {
    const children = compStatNode.nodeChildren

    cast('Token', 'OPBRACE', children[0])
    const statListNode = cast('SyntaxTree', 'StatList', children[1])
    cast('Token', 'CLBRACE', children[2])

    return this.ParseStatList(statListNode)
  }

  ParseIfStat(ifStatNode: SyntaxTree): If {
    const children = ifStatNode.nodeChildren

    cast('Token', 'IF', children[0])
    cast('Token', 'OPPAR', children[1])
    const expressionNode = cast('SyntaxTree', 'Expression', children[2])
    cast('Token', 'CLPAR', children[3])
    const statementIfBody = cast('SyntaxTree', 'Statement', children[4])
    const statementElseBody = cast('SyntaxTree', 'ElseStat', children[5])

    return {
      kind: 'if',
      condition: this.ParseExpression(expressionNode),
      ifBody: this.ParseStatement(statementIfBody),
      elseBody: this.ParseElseStat(statementElseBody)
    }
  }

  ParseElseStat(elseStatNode: SyntaxTree): Statement[] {
    const children = elseStatNode.nodeChildren

    if (children.length === 0) {
      return []
    }

    cast('Token', 'ELSE', children[0])
    const statementNode = cast('SyntaxTree', 'Statement', children[1])

    return this.ParseStatement(statementNode)
  }

  ParseWhileStat(whileStatNode: SyntaxTree): While {
    const children = whileStatNode.nodeChildren

    cast('Token', 'WHILE', children[0])
    cast('Token', 'OPPAR', children[1])
    const expressionNode = cast('SyntaxTree', 'Expression', children[2])
    cast('Token', 'CLPAR', children[3])
    const statementNode = cast('SyntaxTree', 'Statement', children[4])
    return {
      kind: 'while',
      condition: this.ParseExpression(expressionNode),
      body: this.ParseStatement(statementNode)
    }
  }

  ParseDoStat(doStatNode: SyntaxTree): Do {
    const children = doStatNode.nodeChildren

    cast('Token', 'DO', children[0])
    const statementNode = cast('SyntaxTree', 'Statement', children[1])
    cast('Token', 'WHILE', children[2])
    cast('Token', 'OPPAR', children[3])
    const expressionNode = cast('SyntaxTree', 'Expression', children[4])
    cast('Token', 'CLPAR', children[5])
    cast('Token', 'SCOLON', children[6])

    return {
      kind: 'do',
      body: this.ParseStatement(statementNode),
      condition: this.ParseExpression(expressionNode)
    }
  }

  ParseForStat(forStatNode: SyntaxTree): For {
    const children = forStatNode.nodeChildren

    cast('Token', 'FOR', children[0])
    cast('Token', 'OPPAR', children[1])
    const variableInitializer = cast('SyntaxTree', 'Variable', children[2])
    cast('Token', 'ASSIGN', children[3])
    const valueInitializer = cast('SyntaxTree', 'Expression', children[4])
    cast('Token', 'SCOLON', children[5])
    const condition = cast('SyntaxTree', 'Expression', children[6])
    cast('Token', 'SCOLON', children[7])
    const variableIncrement = cast('SyntaxTree', 'Variable', children[8])
    cast('Token', 'ASSIGN', children[9])
    const valueIncrement = cast('SyntaxTree', 'Expression', children[10])
    cast('Token', 'CLPAR', children[11])
    const statementBody = cast('SyntaxTree', 'Statement', children[12])

    return {
      kind: 'for',
      initializer: {
        kind: 'assignment',
        leftSide: this.ParseVariable(variableInitializer),
        rightSide: this.ParseExpression(valueInitializer)
      },
      condition: this.ParseExpression(condition),
      increment: {
        kind: 'assignment',
        leftSide: this.ParseVariable(variableIncrement),
        rightSide: this.ParseExpression(valueIncrement)
      },
      body: this.ParseStatement(statementBody)
    }
  }

  ParseReadStat(readStatNode: SyntaxTree): Read {
    const children = readStatNode.nodeChildren

    cast('Token', 'READ', children[0])
    cast('Token', 'OPPAR', children[1])
    const readListNode = cast('SyntaxTree', 'ReadList', children[2])
    cast('Token', 'CLPAR', children[3])
    cast('Token', 'SCOLON', children[4])

    return {
      kind: 'read',
      receptors: this.ParseReadList(readListNode)
    }
  }

  ParseReadList(readListNode: SyntaxTree): IdentifierReference[] {
    const result: IdentifierReference[] = []
    readListNode.nodeChildren.forEach(variableNode => {
      if (isToken(variableNode)) {
        return castType('COMMA', variableNode)
      }

      result.push(this.ParseVariable(castType('Variable', variableNode)))
    })

    return result
  }

  ParseWriteStat(writeStatNode: SyntaxTree): Write {
    const children = writeStatNode.nodeChildren

    cast('Token', 'WRITE', children[0])
    cast('Token', 'OPPAR', children[1])
    const writeListNode = cast('SyntaxTree', 'WriteList', children[2])
    cast('Token', 'CLPAR', children[3])
    cast('Token', 'SCOLON', children[4])

    return {
      kind: 'write',
      sources: this.ParseWriteList(writeListNode)
    }
  }

  ParseWriteList(writeListNode: SyntaxTree): WriteSource[] {
    const result: WriteSource[] = []
    writeListNode.nodeChildren.forEach(writeElemNode => {
      if (isToken(writeElemNode) && writeElemNode.type === 'COMMA') {
        return
      }

      const child = cast('SyntaxTree', 'WriteElem', writeElemNode).nodeChildren[0]

      if (isToken(child) && castType('STRING', child)) {
        return result.push({
          kind: 'string',
          value: child.value,
          codeValue: child.text
        })
      }

      result.push(this.ParseExpression(cast('SyntaxTree', 'Expression', child)))
    })

    return result
  }

  ParseAssignStat(assignStatNode: SyntaxTree): Assignment {
    const children = assignStatNode.nodeChildren

    const variableNode = cast('SyntaxTree', 'Variable', children[0])
    cast('Token', 'ASSIGN', children[1])
    const expressionNode = cast('SyntaxTree', 'Expression', children[2])
    cast('Token', 'SCOLON', children[3])

    return {
      kind: 'assignment',
      leftSide: this.ParseVariable(variableNode),
      rightSide: this.ParseExpression(expressionNode)
    }
  }

  ParseCallStat(callStatNode: SyntaxTree): FunctionCall {
    const children = callStatNode.nodeChildren

    cast('Token', 'CALL', children[0])
    const funcCallNode = cast('SyntaxTree', 'FuncCall', children[1])
    cast('Token', 'SCOLON', children[2])

    return {
      ...this.ParseFuncCall(funcCallNode),
      inExpression: false
    }
  }

  ParseFuncCall(funcCallNode: SyntaxTree): FunctionCall {
    const children = funcCallNode.nodeChildren

    const name = cast('Token', 'ID', children[0]).value
    cast('Token', 'OPPAR', children[1])
    const funcArguments = cast('SyntaxTree', 'Arguments', children[2])
    cast('Token', 'CLPAR', children[3])

    return {
      kind: 'function call',
      name,
      arguments: this.ParseArguments(funcArguments),
      inExpression: true
    }
  }

  ParseArguments(argumentsNode: SyntaxTree): Expression[] {
    const children = argumentsNode.nodeChildren

    if (children.length === 0) {
      return []
    }

    return this.ParseExprList(cast('SyntaxTree', 'ExprList', children[0]))
  }

  ParseExprList(exprListNode: SyntaxTree): Expression[] {
    const result: Expression[] = []
    exprListNode.nodeChildren.forEach(expressionNode => {
      if (isToken(expressionNode)) {
        return castType('COMMA', expressionNode)
      }

      result.push(this.ParseExpression(castType('Expression', expressionNode)))
    })

    return result
  }

  ParseReturnStat(returnStatNode: SyntaxTree): Return {
    const children = returnStatNode.nodeChildren

    cast('Token', 'RETURN', children[0])

    if (isToken(children[1])) {
      cast('Token', 'SCOLON', children[1])
      return {
        kind: 'return'
      }
    }

    const expressionNode = cast('SyntaxTree', 'Expression', children[1])
    cast('Token', 'SCOLON', children[2])

    return {
      kind: 'return',
      body: this.ParseExpression(expressionNode)
    }
  }

  ParseExpression(expressionNode: SyntaxTree): Expression {
    const children = expressionNode.nodeChildren
    const firstChild = castClass('SyntaxTree', children[0])

    switch (firstChild.nodeName) {
      case 'AuxExpr1':
        return this.ParseAuxExpr1(firstChild)

      case 'Expression':
        const expressionNode = cast('SyntaxTree', 'Expression', children[0])
        cast('Token', 'OR', children[1])
        const auxExpr1Node = cast('SyntaxTree', 'AuxExpr1', children[2])
        return {
          kind: 'or',
          leftSide: this.ParseExpression(expressionNode),
          rightSide: this.ParseAuxExpr1(auxExpr1Node)
        } as LogicalOR

      default: throw new Error('Unrecognized Expression')
    }
  }

  ParseAuxExpr1(auxExpr1Node: SyntaxTree): Expression {
    const children = auxExpr1Node.nodeChildren

    if (castClass('SyntaxTree', children[0]).nodeName === 'AuxExpr2') {
      return this.ParseAuxExpr2(cast('SyntaxTree', 'AuxExpr2', children[0]))
    }

    const leftExpr = cast('SyntaxTree', 'AuxExpr1', children[0])
    cast('Token', 'AND', children[1])
    const rightExpr = cast('SyntaxTree', 'AuxExpr2', children[2])

    return {
      kind: 'and',
      leftSide: this.ParseAuxExpr1(leftExpr),
      rightSide: this.ParseAuxExpr2(rightExpr)
    } as LogicalAND
  }

  ParseAuxExpr2(auxExpr2Node: SyntaxTree): Expression {
    const children = auxExpr2Node.nodeChildren

    if (isSyntaxTree(children[0])) {
      return this.ParseAuxExpr3(cast('SyntaxTree', 'AuxExpr3', children[0]))
    }

    return {
      kind: 'not',
      target: this.ParseAuxExpr3(cast('SyntaxTree', 'AuxExpr3', children[1]))
    } as LogicalNOT
  }

  ParseAuxExpr3(auxExpr3Node: SyntaxTree): Expression {
    const children = auxExpr3Node.nodeChildren

    if (children.length === 1) {
      return this.ParseAuxExpr4(cast('SyntaxTree', 'AuxExpr4', children[0]))
    }

    const leftExpr = cast('SyntaxTree', 'AuxExpr4', children[0])
    const operator = cast('Token', 'RELOP', children[1]).text
    const rightExpr = cast('SyntaxTree', 'AuxExpr4', children[2])

    const kind = {
      '<=': 'less or equal',
      '<': 'less than',
      '>=': 'greater or equal',
      '>': 'greater than',
      '=': 'equal',
      '!=': 'not equal'
    }[operator]

    if(!kind) {
      throw new Error('Unexpected operator ' + operator)
    }

    return {
      kind,
      leftSide: this.ParseAuxExpr4(leftExpr),
      rightSide: this.ParseAuxExpr4(rightExpr)
    } as Comparison
  }

  ParseVariable(variableNode: SyntaxTree): IdentifierReference {
    const children = variableNode.nodeChildren

    const name = cast('Token', 'ID', children[0]).value
    const subscriptsNode = cast('SyntaxTree', 'Subscripts', children[1])

    return {
      kind: 'identifier reference',
      name,
      subscripts: this.ParseSubscripts(subscriptsNode)
    }
  }

  ParseSubscripts(subscriptsNode: SyntaxTree): Expression[] {
    const children = subscriptsNode.nodeChildren

    if (children.length === 0) {
      return []
    }

    cast('Token', 'OPBRAK', children[0])
    const subscrListNode = cast('SyntaxTree', 'SubscrList', children[1])
    cast('Token', 'CLBRAK', children[2])

    return this.ParseSubscrList(subscrListNode)
  }

  ParseSubscrList(subscrListNode: SyntaxTree): Expression[] {
    const result: Expression[] = []
    subscrListNode.nodeChildren.forEach(auxExpr4Node => {
      if (isToken(auxExpr4Node)) {
        return castType('COMMA', auxExpr4Node)
      }

      result.push(this.ParseAuxExpr4(auxExpr4Node))
    })

    return result
  }

  ParseAuxExpr4(auxExpr4Node: SyntaxTree): Expression {
    const children = auxExpr4Node.nodeChildren

    if (castClass('SyntaxTree', children[0]).nodeName === 'Term') {
      return this.ParseTerm(cast('SyntaxTree', 'Term', children[0]))
    }

    const leftExpr = cast('SyntaxTree', 'AuxExpr4', children[0])
    const operator = cast('Token', 'ADOP', children[1]).text
    const rightExpr = cast('SyntaxTree', 'Term', children[2])

    const kind = operator === '+' ? 'addition' : operator === '-' ? 'subtraction' : null

    if (!kind) {
      throw new Error('Unexpected operator ' + operator)
    }

    return {
      kind,
      leftSide: this.ParseAuxExpr4(leftExpr),
      rightSide: this.ParseTerm(rightExpr)
    } as (Addition | Subtraction)
  }

  ParseTerm(termNode: SyntaxTree): Expression {
    const children = termNode.nodeChildren

    if (castClass('SyntaxTree', children[0]).nodeName === 'Factor') {
      return this.ParseFactor(cast('SyntaxTree', 'Factor', children[0]))
    }

    const leftExpr = cast('SyntaxTree', 'Term', children[0])
    const operator = cast('Token', 'MULTOP', children[1]).text
    const rightExpr = cast('SyntaxTree', 'Factor', children[2])

    const kind = operator === '*'
      ? 'multiplication'
      : operator === '/'
        ? 'division'
        : operator === '%'
          ? 'modulus'
          : null

    if (!kind) {
      throw new Error('Unexpected operator ' + operator)
    }

    return {
      kind,
      leftSide: this.ParseTerm(leftExpr),
      rightSide: this.ParseFactor(rightExpr)
    } as (Multiplication | Division | Modulus)
  }

  ParseFactor(factorNode: SyntaxTree): Expression {
    const children = factorNode.nodeChildren
    const firstChild = children[0]
    if (isToken(firstChild)) {
      switch (firstChild.type) {
        case 'INTCT': return {
          kind: 'integer',
          value: firstChild.value
        } as Int

        case 'FLOATCT': return {
          kind: 'float',
          value: firstChild.value
        } as Float

        case 'CHARCT': return {
          kind: 'character',
          stringValue: firstChild.value,
          intValue: firstChild.value.charCodeAt(0),
          codeValue: firstChild.text
        }

        case 'TRUE': return {
          kind: 'boolean',
          value: true
        } as IBoolean

        case 'FALSE': return {
          kind: 'boolean',
          value: false
        } as IBoolean

        case 'NEG':
          cast('Token', 'NEG', children[0])
          return {
            kind: 'negation',
            target: this.ParseFactor(cast('SyntaxTree', 'Factor', children[1]))
          } as Negation

        case 'OPPAR':
          cast('Token', 'OPPAR', children[0])
          const expression = cast('SyntaxTree', 'Expression', children[1])
          cast('Token', 'CLPAR', children[2])
          return this.ParseExpression(expression)

        default: throw new Error('Unrecognized Factor')
      }
    }

    switch (firstChild.nodeName) {
      case 'Variable':
        return this.ParseVariable(firstChild)

      case 'FuncCall':
        return this.ParseFuncCall(firstChild)

      default: throw new Error('Unrecognized Factor')
    }
  }
}

class BackmapConverter extends Converter {

  backmap: Backmap = {
    parenthesizedInCode: new Map()
  }

  ParseFactor(factorNode: SyntaxTree): Expression {
    const result = super.ParseFactor(factorNode)

    const children = factorNode.nodeChildren
    const firstChild = children[0]
    if (isToken(firstChild) && firstChild.type === 'OPPAR') {
      this.backmap.parenthesizedInCode.set(result, true)
    }

    return result
  }
}