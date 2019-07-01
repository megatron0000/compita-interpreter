/**
 * Disponibiliza serviços de printer para a linguagem COMPITA2019
 */

import { repeat } from "../../common";
import { Program, Declaration, IFunction, Statement, Assignment, IdentifierReference, Expression, IString } from "../abstracttree/definitions";
import { Backmap } from "../conversion";


export class PrinterVisitor {

  /**
   * 
   * @param print Should implicitly print newlines
   */
  constructor(
    private print: (...msg: string[]) => any,
    private backmap?: Backmap
  ) { }

  tabulate(tabulation: number) {
    return repeat('  ', tabulation)
  }

  visitProgram(node: Program) {
    this.print(`program ${node.name} {`)
    this.print('')

    if (node.declarations.length) {
      this.print('global:')
      this.print('')
      this.printDeclarations(node.declarations, 0)
      this.print('')
      this.print('')
    }

    this.print('functions:')
    this.print('')
    node.functions.forEach(func => this.printFunction(func))
    this.print('')

    // this.print('')
    this.print('}')
  }

  printDeclarations(decls: Declaration[], tabulation: number) {
    decls.forEach(decl => {
      let text = `${decl.type} ${decl.identifier.name}`
      if (decl.identifier.subscripted) {
        text += `[${decl.identifier.dimensions.join(', ')}]`
      }
      text += ';'
      this.print(this.tabulate(tabulation) + text)
    })
  }

  printFunction(func: IFunction) {
    if (func.kind === 'main') {
      this.print('main {')
      this.print('')
    } else {
      const args: string[] = []
      for (let arg of func.arguments) {
        args.push(`${arg.type} ${arg.name}`)
      }
      this.print(`${func.returnType} ${func.name}(${args.join(', ')}) {`)
      this.print('')
    }

    if (func.declarations.length) {
      this.print(this.tabulate(1) + 'local:')
      this.print('')
      this.printDeclarations(func.declarations, 1)
      this.print('')
      this.print('')
    }
    this.print(this.tabulate(1) + 'statements:')
    this.print('')
    this.printStatements(func.statements, 1)
    this.print('')
    this.print('}')
    this.print('')
  }

  printStatements(stats: Statement[], tabulation: number) {
    stats.forEach(stat => this.printStatement(stat, tabulation))
  }

  printStatement(stat: Statement, tabulation: number) {
    switch (stat.kind) {
      case 'assignment':
        this.print(this.tabulate(tabulation) + this.stringifyAssignment(stat) + ';')
        break
      case 'do':
        this.print(this.tabulate(tabulation) + 'do {')
        this.printStatements(stat.body, tabulation + 1)
        this.print(`${this.tabulate(tabulation)}}while(${this.stringifyExpression(stat.condition)});`)
        break
      case 'for':
        this.print(`${this.tabulate(tabulation)}for (${this.stringifyAssignment(stat.initializer)}; ${this.stringifyExpression(stat.condition)}; ${this.stringifyAssignment(stat.increment)}) {`)
        this.printStatements(stat.body, tabulation + 1)
        this.print(`${this.tabulate(tabulation)}}`)
        break
      case 'function call':
        this.print(`${this.tabulate(tabulation)}call ${this.stringifyExpression(stat)};`)
        break
      case 'if':
        this.print(`${this.tabulate(tabulation)}if(${this.stringifyExpression(stat.condition)}) {`)
        this.printStatements(stat.ifBody, tabulation + 1)
        if (stat.elseBody.length) {
          this.print(`${this.tabulate(tabulation)}} else {`)
          this.printStatements(stat.elseBody, tabulation + 1)
        }
        this.print(`${this.tabulate(tabulation)}}`)
        break
      case 'read':
        this.print(`${this.tabulate(tabulation)}read(${stat.receptors.map(this.stringifyIdentifierReference.bind(this)).join(', ')});`)
        break
      case 'return':
        let result = `${this.tabulate(tabulation)}return`
        if (stat.body) {
          result += ' ' + this.stringifyExpression(stat.body)
        }
        this.print(result + ';')
        break
      case 'while':
        this.print(`${this.tabulate(tabulation)}while(${this.stringifyExpression(stat.condition)}) {`)
        this.printStatements(stat.body, tabulation + 1)
        this.print(`${this.tabulate(tabulation)}}`)
        break
      case 'write':
        let writeResult = `${this.tabulate(tabulation)}write(`
        writeResult += stat.sources.map(source => {
          if (source.kind === 'string') {
            return this.stringifyString(source)
          }
          return this.stringifyExpression(source)
        }).join(', ')
        this.print(writeResult + ');')
        break
    }
  }

  stringifyString(str: IString) {
    return str.codeValue
  }

  stringifyIdentifierReference(ref: IdentifierReference) {
    let result = ref.name
    if (ref.subscripts.length) {
      result += `[${ref.subscripts.map(subscr => this.stringifyExpression(subscr)).join(', ')}]`
    }
    return result
  }

  /**
   * TODO: Correct parenthesize logic ! Precedence likely does not cover all cases.
   * It would be necessary to specify parenthesize rules based on `(parent operator, child operator)` rules
   * @param expr 
   * @param parenthesize 
   */
  stringifyExpression(expr: Expression): string {
    let inner = ''
    switch (expr.kind) {
      case 'and':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` && ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'addition':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` + ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'subtraction':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` - ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'multiplication':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` * ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'division':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` / ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'modulus':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` % ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'boolean':
        inner = expr.value ? 'true' : 'false'
        break
      case 'character':
        inner = expr.codeValue
        break
      case 'less or equal':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` <= ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'less than':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` < ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'greater or equal':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` >= ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'greater than':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` > ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'equal':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` = ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'not equal':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` != ${this.stringifyExpression(expr.rightSide)}`
        break
      case 'float':
        inner = expr.value.toString()
        break
      case 'function call':
        inner = `${expr.name}(${expr.arguments.map(expr => this.stringifyExpression(expr)).join(', ')})`
        break
      case 'identifier reference':
        inner = this.stringifyIdentifierReference(expr)
        break
      case 'integer':
        inner = expr.value.toString()
        break
      case 'negation':
        inner = `~${this.stringifyExpression(expr.target)}`
        break
      case 'not':
        inner = `!${this.stringifyExpression(expr.target)}`
        break
      case 'or':
        inner = `${this.stringifyExpression(expr.leftSide)}` +
          ` || ${this.stringifyExpression(expr.rightSide)}`
        break
      default:
        throw new Error('Unexpected expression kind')
    }
    if (!this.backmap || this.backmap.parenthesizedInCode.get(expr)) {
      inner = '(' + inner + ')'
    }
    return inner
  }

  stringifyAssignment(assign: Assignment): string {
    return `${this.stringifyIdentifierReference(assign.leftSide)} <- ${this.stringifyExpression(assign.rightSide)}`
  }
}