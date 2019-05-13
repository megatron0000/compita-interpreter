import { notEqual } from "assert";

// Definitions for the abstract
// syntax tree associated to COMPITA-2019

export type VariableType = 'int' | 'float' | 'char' | 'logic' | 'void'

export type ASTNode = Program | Declaration | Identifier | IFunction | Statement | Expression

// any list may be empty

export interface Program {
  kind: 'program'
  name: string
  declarations: Declaration[] // 1 Declaration declares 1 (no more !) identifier
  functions: IFunction[]
}

export interface Declaration {
  kind: 'declaration'
  type: VariableType
  identifier: Identifier
}

export interface Identifier {
  kind: 'identifier'
  name: string
  dimensions: number[], // empty for scalar identifier
  subscripted: boolean
}

export type IFunction = MainFunction | RegularFunction

export interface MainFunction {
  kind: 'main'
  declarations: Declaration[]
  statements: Statement[]
}

export interface RegularFunction {
  kind: 'function'
  returnType: VariableType
  name: string
  arguments: { [key: string]: VariableType }
  declarations: Declaration[]
  statements: Statement[]
}

export type Statement = If | While | Do | For | Read | Write | Assignment | FunctionCall | Return

export interface If {
  kind: 'if'
  condition: Expression
  ifBody: Statement[]
  elseBody: Statement[] // will be empty if the "If" has no else part
}

export interface While {
  kind: 'while'
  condition: Expression
  body: Statement[]
}

export interface Do {
  kind: 'do'
  condition: Expression
  body: Statement[]
}

export interface For {
  kind: 'for'
  initializer: Assignment
  condition: Expression
  increment: Assignment
  body: Statement[]
}

export interface Read {
  kind: 'read'
  receptors: IdentifierReference[]
}

export interface Write {
  kind: 'write'
  sources: WriteSource[]
}

export type WriteSource = IString | Expression

export interface Assignment {
  kind: 'assignment'
  leftSide: IdentifierReference
  rightSide: Expression
}

export interface IdentifierReference extends Typed {
  kind: 'identifier reference'
  name: string
  subscripts: Expression[] // may be empty
}

/**
 * Does not differentiate CALL from other function calls. This
 * distinction is inferred from context of ocurrence of the call.
 */
export interface FunctionCall extends Typed {
  kind: 'function call'
  name: string
  arguments: Expression[]
}

export interface Return {
  kind: 'return'
  body?: Expression
}

export type Expression = BooleanOperation | Arithmetic | Negation | Constant | IdentifierReference | FunctionCall

export type BooleanOperation = LogicalOR | LogicalAND | LogicalNOT | Comparison

export interface Typed {
  resolvedType?: VariableType
}

export interface LogicalOR extends Typed {
  kind: 'or'
  leftSide: Expression
  rightSide: Expression
}

export interface LogicalAND extends Typed {
  kind: 'and'
  leftSide: Expression
  rightSide: Expression
}

export interface LogicalNOT extends Typed {
  kind: 'not'
  target: Expression
}

export interface Comparison extends Typed {
  kind: 'comparison'
  operator: '<=' | '<' | '>=' | '>' | '=' | '!='
  leftSide: Expression
  rightSide: Expression
}

export interface Arithmetic extends Typed {
  kind: 'arithmetic'
  operator: '+' | '-' | '*' | '/' | '%'
  leftSide: Expression
  rightSide: Expression
}

export interface Negation extends Typed {
  kind: 'negation'
  target: Expression
}

export type Constant = IBoolean | Char | Int | Float

export interface IBoolean extends Typed {
  kind: 'boolean'
  value: boolean
}

export interface Char extends Typed {
  kind: 'character'
  intValue: number
  stringValue: string
  codeValue: string // value as would appear in code
}

export interface Int extends Typed {
  kind: 'integer'
  value: number
}

export interface Float extends Typed {
  kind: 'float'
  value: number
}

// although this is a literal, it is not considered a "Constant"
export interface IString {
  kind: 'string'
  value: string
  codeValue: string // value as would appear in code
}

export function Precedence(node: ASTNode): number {
  switch (node.kind) {
    case 'or':
      return 10000
    case 'and':
      return 11000
    case 'not':
      return 12000
    case 'comparison':
      return 13000
    case 'arithmetic':
      switch (node.operator) {
        case '+': case '-':
          return 14000
        case '*': case '/': case '%':
          return 15000
      }
    case 'negation':
      return 16000
    default:
      return Infinity // others do not need precedence
  }
}
