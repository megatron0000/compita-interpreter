// Conversion procedures from verbose tree to abstract tree
// associated to COMPITA-2019

import { SyntaxTree, isToken, Token, castClass, castType, cast, isSyntaxTree } from "./verbosetree/definitions";
import { Program, Declaration, VariableType, IFunction, Statement, If, While, Do, For, Identifier, IdentifierReference, Read, Write, WriteSource, IString, Assignment, FunctionCall, Expression, Return, Arithmetic, Int, Float, Char, IBoolean, LogicalOR, LogicalAND, Comparison, Negation, LogicalNOT } from "./abstracttree/definitions";


export function ConvertToAST(tree: SyntaxTree): Program {
  const globDecls = cast('SyntaxTree', 'GlobDecls', tree.nodeChildren[3])
  const declList = globDecls.nodeChildren.length ? cast('SyntaxTree', 'DeclList', globDecls.nodeChildren[2]) : undefined
  return {
    kind: 'program',
    name: castClass('Token', tree.nodeChildren[1]).value,
    declarations: declList ? ParseDeclList(declList as SyntaxTree) : [],
    functions: ParseFunctionArray(
      cast('SyntaxTree', 'FuncList',
        cast('SyntaxTree', 'Functions', tree.nodeChildren[4]).nodeChildren[2]
      ).nodeChildren as SyntaxTree[]
    ),
  }
}

function ParseDeclList(declListNode: SyntaxTree): Declaration[] {
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
          subscripted: dimensions.length !== 0
        }
      })
    })
  })

  return result
}

function ParseFunctionArray(functionNodes: SyntaxTree[]): IFunction[] {
  const result: IFunction[] = []

  functionNodes.forEach(fNode => {
    cast('SyntaxTree', 'Function', fNode)
    const headerNode = cast('SyntaxTree', 'Header', fNode.nodeChildren[0])
    cast('Token', 'OPBRACE', fNode.nodeChildren[1])
    const locDeclsNode = cast('SyntaxTree', 'LocDecls', fNode.nodeChildren[2])
    const statsNode = cast('SyntaxTree', 'Stats', fNode.nodeChildren[3])
    cast('Token', 'CLBRACE', fNode.nodeChildren[4])

    const headerInfo = ParseFunctionHeader(headerNode)
    const declarations = ParseLocDecls(locDeclsNode)
    const statements = ParseStats(statsNode)

    result.push(headerInfo.isMain ? {
      kind: 'main',
      declarations,
      statements
    } : {
        kind: 'function',
        declarations,
        statements,
        arguments: headerInfo.arguments as { [key: string]: VariableType },
        name: headerInfo.name as string,
        returnType: headerInfo.returnType as VariableType
      }
    )

  })

  return result
}

type FunctionHeaderResult = {
  isMain: boolean
  returnType?: VariableType
  arguments?: { [key: string]: VariableType }
  name?: string
}

function ParseFunctionHeader(headerNode: SyntaxTree): FunctionHeaderResult {
  const firstChild = headerNode.nodeChildren[0]
  if (isToken(firstChild)) {
    castType('MAIN', firstChild)
    return { isMain: true }
  }

  const returnType = castClass('Token', firstChild.nodeChildren[0]).text as VariableType
  const name = cast('Token', 'ID', headerNode.nodeChildren[1]).value
  cast('Token', 'OPPAR', headerNode.nodeChildren[2])
  const functionArguments = ParseParams(cast('SyntaxTree', 'Params', headerNode.nodeChildren[3]))

  return { isMain: false, returnType, arguments: functionArguments, name }
}

function ParseParams(paramsNode: SyntaxTree): { [key: string]: VariableType } {
  const result: { [key: string]: VariableType } = {}

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
    result[argumentName] = argumentType as VariableType
  })

  return result
}

function ParseLocDecls(locDeclsNode: SyntaxTree): Declaration[] {
  if (locDeclsNode.nodeChildren.length === 0) {
    return []
  }

  const children = locDeclsNode.nodeChildren
  cast('Token', 'LOCAL', children[0])
  cast('Token', 'COLON', children[1])
  const declListNode = cast('SyntaxTree', 'DeclList', children[2])

  const declarations = ParseDeclList(declListNode)

  return declarations
}

function ParseStats(statsNode: SyntaxTree): Statement[] {
  const children = statsNode.nodeChildren
  cast('Token', 'STATEMENTS', children[0])
  cast('Token', 'COLON', children[1])
  const statList = cast('SyntaxTree', 'StatList', children[2])

  const statements = ParseStatList(statList)

  return statements
}

function ParseStatList(statListNode: SyntaxTree): Statement[] {
  const result: Statement[] = []

  statListNode.nodeChildren.forEach(statementNode =>
    ParseStatement(cast('SyntaxTree', 'Statement', statementNode)).forEach(res => result.push(res))
  )

  return result
}

/**
 * A unique `Statement` node may contain no statements, 1 statement,
 * or more (if it contains a `CompStat` inside)
 */
function ParseStatement(statementNode: SyntaxTree): Statement[] {
  let child = statementNode.nodeChildren[0]

  if (isToken(child)) {
    castType('SCOLON', child)
    return []
  }

  child = castClass('SyntaxTree', child)

  switch (child.nodeName) {
    case 'CompStat': return ParseCompStat(child)
    case 'IfStat': return [ParseIfStat(child)]
    case 'WhileStat': return [ParseWhileStat(child)]
    case 'DoStat': return [ParseDoStat(child)]
    case 'ForStat': return [ParseForStat(child)]
    case 'ReadStat': return [ParseReadStat(child)]
    case 'WriteStat': return [ParseWriteStat(child)]
    case 'AssignStat': return [ParseAssignStat(child)]
    case 'CallStat': return [ParseCallStat(child)]
    case 'ReturnStat': return [ParseReturnStat(child)]
    default: throw new Error('Unrecognized child of Statement node')
  }


}

function ParseCompStat(compStatNode: SyntaxTree): Statement[] {
  const children = compStatNode.nodeChildren

  cast('Token', 'OPBRACE', children[0])
  const statListNode = cast('SyntaxTree', 'StatList', children[1])
  cast('Token', 'CLBRACE', children[2])

  return ParseStatList(statListNode)
}

function ParseIfStat(ifStatNode: SyntaxTree): If {
  const children = ifStatNode.nodeChildren

  cast('Token', 'IF', children[0])
  cast('Token', 'OPPAR', children[1])
  const expressionNode = cast('SyntaxTree', 'Expression', children[2])
  cast('Token', 'CLPAR', children[3])
  const statementIfBody = cast('SyntaxTree', 'Statement', children[4])
  const statementElseBody = cast('SyntaxTree', 'ElseStat', children[5])

  return {
    kind: 'if',
    condition: ParseExpression(expressionNode),
    ifBody: ParseStatement(statementIfBody),
    elseBody: ParseElseStat(statementElseBody)
  }
}

function ParseElseStat(elseStatNode: SyntaxTree): Statement[] {
  const children = elseStatNode.nodeChildren

  if (children.length === 0) {
    return []
  }

  cast('Token', 'ELSE', children[0])
  const statementNode = cast('SyntaxTree', 'Statement', children[1])

  return ParseStatement(statementNode)
}

function ParseWhileStat(whileStatNode: SyntaxTree): While {
  const children = whileStatNode.nodeChildren

  cast('Token', 'WHILE', children[0])
  cast('Token', 'OPPAR', children[1])
  const expressionNode = cast('SyntaxTree', 'Expression', children[2])
  cast('Token', 'CLPAR', children[3])
  const statementNode = cast('SyntaxTree', 'Statement', children[4])
  return {
    kind: 'while',
    condition: ParseExpression(expressionNode),
    body: ParseStatement(statementNode)
  }
}

function ParseDoStat(doStatNode: SyntaxTree): Do {
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
    body: ParseStatement(statementNode),
    condition: ParseExpression(expressionNode)
  }
}

function ParseForStat(forStatNode: SyntaxTree): For {
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
      leftSide: ParseVariable(variableInitializer),
      rightSide: ParseExpression(valueInitializer)
    },
    condition: ParseExpression(condition),
    increment: {
      kind: 'assignment',
      leftSide: ParseVariable(variableIncrement),
      rightSide: ParseExpression(valueIncrement)
    },
    body: ParseStatement(statementBody)
  }
}

function ParseReadStat(readStatNode: SyntaxTree): Read {
  const children = readStatNode.nodeChildren

  cast('Token', 'READ', children[0])
  cast('Token', 'OPPAR', children[1])
  const readListNode = cast('SyntaxTree', 'ReadList', children[2])
  cast('Token', 'CLPAR', children[3])
  cast('Token', 'SCOLON', children[4])

  return {
    kind: 'read',
    receptors: ParseReadList(readListNode)
  }
}

function ParseReadList(readListNode: SyntaxTree): IdentifierReference[] {
  const result: IdentifierReference[] = []
  readListNode.nodeChildren.forEach(variableNode => {
    if (isToken(variableNode)) {
      return castType('COMMA', variableNode)
    }

    result.push(ParseVariable(castType('Variable', variableNode)))
  })

  return result
}

function ParseWriteStat(writeStatNode: SyntaxTree): Write {
  const children = writeStatNode.nodeChildren

  cast('Token', 'WRITE', children[0])
  cast('Token', 'OPPAR', children[1])
  const writeListNode = cast('SyntaxTree', 'WriteList', children[2])
  cast('Token', 'CLPAR', children[3])
  cast('Token', 'SCOLON', children[4])

  return {
    kind: 'write',
    sources: ParseWriteList(writeListNode)
  }
}

function ParseWriteList(writeListNode: SyntaxTree): WriteSource[] {
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

    result.push(ParseExpression(cast('SyntaxTree', 'Expression', child)))
  })

  return result
}

function ParseAssignStat(assignStatNode: SyntaxTree): Assignment {
  const children = assignStatNode.nodeChildren

  const variableNode = cast('SyntaxTree', 'Variable', children[0])
  cast('Token', 'ASSIGN', children[1])
  const expressionNode = cast('SyntaxTree', 'Expression', children[2])
  cast('Token', 'SCOLON', children[3])

  return {
    kind: 'assignment',
    leftSide: ParseVariable(variableNode),
    rightSide: ParseExpression(expressionNode)
  }
}

function ParseCallStat(callStatNode: SyntaxTree): FunctionCall {
  const children = callStatNode.nodeChildren

  cast('Token', 'CALL', children[0])
  const funcCallNode = cast('SyntaxTree', 'FuncCall', children[1])
  cast('Token', 'SCOLON', children[2])

  return ParseFuncCall(funcCallNode)
}

function ParseFuncCall(funcCallNode: SyntaxTree): FunctionCall {
  const children = funcCallNode.nodeChildren

  const name = cast('Token', 'ID', children[0]).value
  cast('Token', 'OPPAR', children[1])
  const funcArguments = cast('SyntaxTree', 'Arguments', children[2])
  cast('Token', 'CLPAR', children[3])

  return {
    kind: 'function call',
    name,
    arguments: ParseArguments(funcArguments)
  }
}

function ParseArguments(argumentsNode: SyntaxTree): Expression[] {
  const children = argumentsNode.nodeChildren

  if (children.length === 0) {
    return []
  }

  return ParseExprList(cast('SyntaxTree', 'ExprList', children[0]))
}

function ParseExprList(exprListNode: SyntaxTree): Expression[] {
  const result: Expression[] = []
  exprListNode.nodeChildren.forEach(expressionNode => {
    if (isToken(expressionNode)) {
      return castType('COMMA', expressionNode)
    }

    result.push(ParseExpression(castType('Expression', expressionNode)))
  })

  return result
}

function ParseReturnStat(returnStatNode: SyntaxTree): Return {
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
    body: ParseExpression(expressionNode)
  }
}

function ParseExpression(expressionNode: SyntaxTree): Expression {
  const children = expressionNode.nodeChildren
  const firstChild = castClass('SyntaxTree', children[0])

  switch (firstChild.nodeName) {
    case 'AuxExpr1':
      return ParseAuxExpr1(firstChild)

    case 'Expression':
      const expressionNode = cast('SyntaxTree', 'Expression', children[0])
      cast('Token', 'OR', children[1])
      const auxExpr1Node = cast('SyntaxTree', 'AuxExpr1', children[2])
      return {
        kind: 'or',
        leftSide: ParseExpression(expressionNode),
        rightSide: ParseAuxExpr1(auxExpr1Node)
      } as LogicalOR

    default: throw new Error('Unrecognized Expression')
  }
}

function ParseAuxExpr1(auxExpr1Node: SyntaxTree): Expression {
  const children = auxExpr1Node.nodeChildren

  if (castClass('SyntaxTree', children[0]).nodeName === 'AuxExpr2') {
    return ParseAuxExpr2(cast('SyntaxTree', 'AuxExpr2', children[0]))
  }

  const leftExpr = cast('SyntaxTree', 'AuxExpr1', children[0])
  cast('Token', 'AND', children[1])
  const rightExpr = cast('SyntaxTree', 'AuxExpr2', children[2])

  return {
    kind: 'and',
    leftSide: ParseAuxExpr1(leftExpr),
    rightSide: ParseAuxExpr2(rightExpr)
  } as LogicalAND
}

function ParseAuxExpr2(auxExpr2Node: SyntaxTree): Expression {
  const children = auxExpr2Node.nodeChildren

  if (isSyntaxTree(children[0])) {
    return ParseAuxExpr3(cast('SyntaxTree', 'AuxExpr3', children[0]))
  }

  return {
    kind: 'not',
    target: ParseAuxExpr3(cast('SyntaxTree', 'AuxExpr3', children[1]))
  } as LogicalNOT
}

function ParseAuxExpr3(auxExpr3Node: SyntaxTree): Expression {
  const children = auxExpr3Node.nodeChildren

  if (children.length === 1) {
    return ParseAuxExpr4(cast('SyntaxTree', 'AuxExpr4', children[0]))
  }

  const leftExpr = cast('SyntaxTree', 'AuxExpr4', children[0])
  const operator = cast('Token', 'RELOP', children[1]).text
  const rightExpr = cast('SyntaxTree', 'AuxExpr4', children[2])

  return {
    kind: 'comparison',
    operator,
    leftSide: ParseAuxExpr4(leftExpr),
    rightSide: ParseAuxExpr4(rightExpr)
  } as Comparison
}

function ParseVariable(variableNode: SyntaxTree): IdentifierReference {
  const children = variableNode.nodeChildren

  const name = cast('Token', 'ID', children[0]).value
  const subscriptsNode = cast('SyntaxTree', 'Subscripts', children[1])

  return {
    kind: 'identifier reference',
    name,
    subscripts: ParseSubscripts(subscriptsNode)
  }
}

function ParseSubscripts(subscriptsNode: SyntaxTree): Expression[] {
  const children = subscriptsNode.nodeChildren

  if (children.length === 0) {
    return []
  }

  cast('Token', 'OPBRAK', children[0])
  const subscrListNode = cast('SyntaxTree', 'SubscrList', children[1])
  cast('Token', 'CLBRAK', children[2])

  return ParseSubscrList(subscrListNode)
}

function ParseSubscrList(subscrListNode: SyntaxTree): Expression[] {
  const result: Expression[] = []
  subscrListNode.nodeChildren.forEach(auxExpr4Node => {
    if (isToken(auxExpr4Node)) {
      return castType('COMMA', auxExpr4Node)
    }

    result.push(ParseAuxExpr4(auxExpr4Node))
  })

  return result
}

function ParseAuxExpr4(auxExpr4Node: SyntaxTree): Expression {
  const children = auxExpr4Node.nodeChildren

  if (castClass('SyntaxTree', children[0]).nodeName === 'Term') {
    return ParseTerm(cast('SyntaxTree', 'Term', children[0]))
  }

  const leftExpr = cast('SyntaxTree', 'AuxExpr4', children[0])
  const operator = cast('Token', 'ADOP', children[1]).text
  const rightExpr = cast('SyntaxTree', 'Term', children[2])

  return {
    kind: 'arithmetic',
    operator,
    leftSide: ParseAuxExpr4(leftExpr),
    rightSide: ParseTerm(rightExpr)
  } as Arithmetic
}

function ParseTerm(termNode: SyntaxTree): Expression {
  const children = termNode.nodeChildren

  if (castClass('SyntaxTree', children[0]).nodeName === 'Factor') {
    return ParseFactor(cast('SyntaxTree', 'Factor', children[0]))
  }

  const leftExpr = cast('SyntaxTree', 'Term', children[0])
  const operator = cast('Token', 'MULTOP', children[1]).text
  const rightExpr = cast('SyntaxTree', 'Factor', children[2])

  return {
    kind: 'arithmetic',
    operator,
    leftSide: ParseTerm(leftExpr),
    rightSide: ParseFactor(rightExpr)
  } as Arithmetic
}

function ParseFactor(factorNode: SyntaxTree): Expression {
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
          target: ParseFactor(cast('SyntaxTree', 'Factor', children[1]))
        } as Negation

      case 'OPPAR':
        cast('Token', 'OPPAR', children[0])
        const expression = cast('SyntaxTree', 'Expression', children[1])
        cast('Token', 'CLPAR', children[2])
        return ParseExpression(expression)

      default: throw new Error('Unrecognized Factor')
    }
  }

  switch (firstChild.nodeName) {
    case 'Variable':
      return ParseVariable(firstChild)

    case 'FuncCall':
      return ParseFuncCall(firstChild)

    default: throw new Error('Unrecognized Factor')
  }
}