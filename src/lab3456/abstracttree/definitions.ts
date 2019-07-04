// Definitions for the abstract
// syntax tree (AST) associated to COMPITA-2019
// The AST can be obtained from a "verbose tree" via the
// `conversion.ts` services

export type VariableType = 'int' | 'float' | 'char' | 'logic' | 'void'

export type ASTNode = Program | Declaration | Identifier | IFunction | Statement | Expression | IString

export interface ASTNodeKinds {
  'program': Program
  'declaration': Declaration
  'identifier': Identifier
  'main': MainFunction
  'function': RegularFunction
  'if': If
  'while': While
  'do': Do
  'for': For
  'read': Read
  'write': Write
  'assignment': Assignment
  'identifier reference': IdentifierReference
  'function call': FunctionCall
  'return': Return
  'or': LogicalOR
  'and': LogicalAND
  'not': LogicalNOT
  'less or equal': LessOrEqual
  'less than': LessThan
  'greater or equal': GreaterOrEqual
  'greater than': GreaterThan
  'equal': Equal
  'not equal': NotEqual
  'addition': Addition
  'subtraction': Subtraction
  'multiplication': Multiplication
  'division': Division
  'modulus': Modulus
  'negation': Negation
  'boolean': IBoolean
  'character': Char
  'integer': Int
  'float': Float
  'string': IString
}

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
  /**
   * Same as `Declaration.type`
   */
  type: VariableType
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
  arguments: Identifier[]
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

export interface Typed {
  resolvedType?: VariableType
}

export interface IdentifierReference extends Typed {
  kind: 'identifier reference'
  name: string
  subscripts: Expression[] // may be empty
}

export interface FunctionCall extends Typed {
  kind: 'function call'
  name: string
  arguments: Expression[]
  /**
   * `true` if and only if this call is inside an expression, as opposed
   * to a CALL statement
   */
  inExpression: boolean
}

export interface Return extends Typed {
  kind: 'return'
  body?: Expression
}

export type Expression = BooleanOperation | ArithmeticOperation | Negation | Constant | IdentifierReference | FunctionCall

export type BooleanOperation = LogicalOR | LogicalAND | LogicalNOT | Comparison

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

export type Comparison = LessOrEqual | LessThan | GreaterOrEqual | GreaterThan | Equal | NotEqual

export interface LessOrEqual extends Typed {
  kind: 'less or equal'
  leftSide: Expression
  rightSide: Expression
}

export interface LessThan extends Typed {
  kind: 'less than'
  leftSide: Expression
  rightSide: Expression
}

export interface GreaterOrEqual extends Typed {
  kind: 'greater or equal'
  leftSide: Expression
  rightSide: Expression
}

export interface GreaterThan extends Typed {
  kind: 'greater than'
  leftSide: Expression
  rightSide: Expression
}

export interface Equal extends Typed {
  kind: 'equal'
  leftSide: Expression
  rightSide: Expression
}

export interface NotEqual extends Typed {
  kind: 'not equal'
  leftSide: Expression
  rightSide: Expression
}

export type ArithmeticOperation = Addition | Subtraction | Multiplication | Division | Modulus

export interface Addition extends Typed {
  kind: 'addition'
  leftSide: Expression
  rightSide: Expression
}

export interface Subtraction extends Typed {
  kind: 'subtraction'
  leftSide: Expression
  rightSide: Expression
}

export interface Multiplication extends Typed {
  kind: 'multiplication'
  leftSide: Expression
  rightSide: Expression
}

export interface Division extends Typed {
  kind: 'division'
  leftSide: Expression
  rightSide: Expression
}

export interface Modulus extends Typed {
  kind: 'modulus'
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
  codeValue: string // value as would appear in code
}

// although this is a literal, it is not considered a "Constant"
export interface IString {
  kind: 'string'
  value: string
  codeValue: string // value as would appear in code
}
