// import { Program, Declaration, Identifier, MainFunction, RegularFunction, If, While, Do, For, Read, Write, Assignment, IdentifierReference, FunctionCall, Return, LogicalOR, LogicalAND, LogicalNOT, Comparison, Arithmetic, Negation, IBoolean, Char, Int, Float, IString, ASTNode } from "./definitions";

// // Algorithm for visiting an abstract tree from COMPITA-2019

// export interface Visitor<T> {
//   beforeProgram(node: Program, ctx: T): any
//   beforeDeclaration(node: Declaration, ctx: T): any
//   beforeIdentifier(node: Identifier, ctx: T): any
//   beforeMainFunction(node: MainFunction, ctx: T): any
//   beforeRegularFunction(node: RegularFunction, ctx: T): any
//   beforeIf(node: If, ctx: T): any
//   beforeWhile(node: While, ctx: T): any
//   beforeDo(node: Do, ctx: T): any
//   beforeFor(node: For, ctx: T): any
//   beforeRead(node: Read, ctx: T): any
//   beforeWrite(node: Write, ctx: T): any
//   beforeAssignment(node: Assignment, ctx: T): any
//   beforeIdentifierReference(node: IdentifierReference, ctx: T): any
//   beforeFunctionCall(node: FunctionCall, ctx: T): any
//   beforeReturn(node: Return, ctx: T): any
//   beforeLogicalOR(node: LogicalOR, ctx: T): any
//   beforeLogicalAND(node: LogicalAND, ctx: T): any
//   beforeLogicalNOT(node: LogicalNOT, ctx: T): any
//   beforeComparison(node: Comparison, ctx: T): any
//   beforeArithmetic(node: Arithmetic, ctx: T): any
//   beforeNegation(node: Negation, ctx: T): any
//   beforeIBoolean(node: IBoolean, ctx: T): any
//   beforeChar(node: Char, ctx: T): any
//   beforeInt(node: Int, ctx: T): any
//   beforeFloat(node: Float, ctx: T): any
//   beforeIString(node: IString, ctx: T): any

//   afterProgram(node: Program, ctx: T): any
//   afterDeclaration(node: Declaration, ctx: T): any
//   afterIdentifier(node: Identifier, ctx: T): any
//   afterMainFunction(node: MainFunction, ctx: T): any
//   afterRegularFunction(node: RegularFunction, ctx: T): any
//   afterIf(node: If, ctx: T): any
//   afterWhile(node: While, ctx: T): any
//   afterDo(node: Do, ctx: T): any
//   afterFor(node: For, ctx: T): any
//   afterRead(node: Read, ctx: T): any
//   afterWrite(node: Write, ctx: T): any
//   afterAssignment(node: Assignment, ctx: T): any
//   afterIdentifierReference(node: IdentifierReference, ctx: T): any
//   afterFunctionCall(node: FunctionCall, ctx: T): any
//   afterReturn(node: Return, ctx: T): any
//   afterLogicalOR(node: LogicalOR, ctx: T): any
//   afterLogicalAND(node: LogicalAND, ctx: T): any
//   afterLogicalNOT(node: LogicalNOT, ctx: T): any
//   afterComparison(node: Comparison, ctx: T): any
//   afterArithmetic(node: Arithmetic, ctx: T): any
//   afterNegation(node: Negation, ctx: T): any
//   afterIBoolean(node: IBoolean, ctx: T): any
//   afterChar(node: Char, ctx: T): any
//   afterInt(node: Int, ctx: T): any
//   afterFloat(node: Float, ctx: T): any
//   afterIString(node: IString, ctx: T): any
// }


// export function ASTVisit<T>(visitor: Visitor<T>, context: T, program: Program) {
//   const queue = new VisitQueue().enqueue(program, 'before')

//   while (!queue.empty()) {
//     const { node, phase } = queue.dequeue()

//     switch (node.kind) {
//       case 'program':
//         if (phase === 'before') {
//           visitor.beforeProgram(node, context)
//         } else {
//           visitor.afterProgram(node, context)
//         }
//         break
//       case 'declaration':
//         if (phase === 'before') {
//           visitor.beforeDeclaration(node, context)
//         } else {
//           visitor.afterDeclaration(node, context)
//         }
//         break
//       case 'identifier':
//         if (phase === 'before') {
//           visitor.beforeIdentifier(node, context)
//         } else {
//           visitor.afterIdentifier(node, context)
//         }
//         break
//       case 'main':
//         if (phase === 'before') {
//           visitor.beforeMainFunction(node, context)
//         } else {
//           visitor.afterMainFunction(node, context)
//         }
//         break
//       case 'function':
//         if (phase === 'before') {
//           visitor.beforeRegularFunction(node, context)
//         } else {
//           visitor.afterRegularFunction(node, context)
//         }
//         break
//       case 'if':
//         if (phase === 'before') {
//           visitor.beforeIf(node, context)
//         } else {
//           visitor.afterIf(node, context)
//         }
//         break
//       case 'while':
//         if (phase === 'before') {
//           visitor.beforeWhile(node, context)
//         } else {
//           visitor.afterWhile(node, context)
//         }
//         break
//       case 'do':
//         if (phase === 'before') {
//           visitor.beforeDo(node, context)
//         } else {
//           visitor.afterDo(node, context)
//         }
//         break
//       case 'for':
//         if (phase === 'before') {
//           visitor.beforeFor(node, context)
//         } else {
//           visitor.afterFor(node, context)
//         }
//         break
//       case 'read':
//         if (phase === 'before') {
//           visitor.beforeRead(node, context)
//         } else {
//           visitor.afterRead(node, context)
//         }
//         break
//       case 'write':
//         if (phase === 'before') {
//           visitor.beforeWrite(node, context)
//         } else {
//           visitor.afterWrite(node, context)
//         }
//         break
//       case 'assignment':
//         if (phase === 'before') {
//           visitor.beforeAssignment(node, context)
//         } else {
//           visitor.afterAssignment(node, context)
//         }
//         break
//       case 'identifier reference':
//         if (phase === 'before') {
//           visitor.beforeIdentifierReference(node, context)
//         } else {
//           visitor.afterIdentifierReference(node, context)
//         }
//         break
//       case 'function call':
//         if (phase === 'before') {
//           visitor.beforeFunctionCall(node, context)
//         } else {
//           visitor.afterFunctionCall(node, context)
//         }
//         break
//       case 'return':
//         if (phase === 'before') {
//           visitor.beforeReturn(node, context)
//         } else {
//           visitor.afterReturn(node, context)
//         }
//         break
//       case 'or':
//         if (phase === 'before') {
//           visitor.beforeLogicalOR(node, context)
//         } else {
//           visitor.afterLogicalOR(node, context)
//         }
//         break
//       case 'and':
//         if (phase === 'before') {
//           visitor.beforeLogicalAND(node, context)
//         } else {
//           visitor.afterLogicalAND(node, context)
//         }
//         break
//       case 'not':
//         if (phase === 'before') {
//           visitor.beforeLogicalNOT(node, context)
//         } else {
//           visitor.afterLogicalNOT(node, context)
//         }
//         break
//       case 'comparison':
//         if (phase === 'before') {
//           visitor.beforeComparison(node, context)
//         } else {
//           visitor.afterComparison(node, context)
//         }
//         break
//       case 'arithmetic':
//         if (phase === 'before') {
//           visitor.beforeArithmetic(node, context)
//         } else {
//           visitor.afterArithmetic(node, context)
//         }
//         break
//       case 'negation':
//         if (phase === 'before') {
//           visitor.beforeNegation(node, context)
//         } else {
//           visitor.afterNegation(node, context)
//         }
//         break
//       case 'boolean':
//         if (phase === 'before') {
//           visitor.beforeIBoolean(node, context)
//         } else {
//           visitor.afterIBoolean(node, context)
//         }
//         break
//       case 'character':
//         if (phase === 'before') {
//           visitor.beforeChar(node, context)
//         } else {
//           visitor.afterChar(node, context)
//         }
//         break
//       case 'integer':
//         if (phase === 'before') {
//           visitor.beforeInt(node, context)
//         } else {
//           visitor.afterInt(node, context)
//         }
//         break
//       case 'float':
//         if (phase === 'before') {
//           visitor.beforeFloat(node, context)
//         } else {
//           visitor.afterFloat(node, context)
//         }
//         break
//       case 'string':
//         if (phase === 'before') {
//           visitor.beforeIString(node, context)
//         } else {
//           visitor.afterIString(node, context)
//         }
//         break
//     }

//     if(phase === 'after') {
//       return
//     }

    
//   }
// }

// type QueueItem = LeadItem | RegularItem

// type RegularItem = {
//   isLead?: false,
//   node: ASTNode,
//   phase: 'before' | 'after',
//   next?: RegularItem
// }

// type LeadItem = {
//   isLead: true,
//   next?: QueueItem
// }

// function cast(type: 'RegularItem', obj: any): RegularItem
// function cast(type: 'LeadItem', obj: any): LeadItem
// function cast(type: 'RegularItem' | 'LeadItem', obj: any): RegularItem | LeadItem {
//   switch (type) {
//     case 'RegularItem':
//       if (obj.isLead) {
//         throw new Error('Tried to cast a LeadItem to a RegularItem')
//       }
//       break

//     case 'LeadItem':
//       if (obj.isLead) {
//         throw new Error('Tried to cast a LeadItem to a RegularItem')
//       }
//       break
//   }
//   return obj
// }

// class VisitQueue {
//   private lead: QueueItem = {
//     isLead: true
//   }

//   private last: QueueItem = this.lead

//   constructor() { }

//   empty(): boolean {
//     return this.last.isLead === true
//   }

//   enqueue(node: ASTNode, phase: 'before' | 'after'): this {
//     this.last.next = {
//       node,
//       phase
//     }
//     this.last = this.last.next
//     return this
//   }

//   dequeue(): { node: ASTNode, phase: 'before' | 'after' } {
//     if (this.empty()) {
//       throw new Error('Cannot dequeue from an empty VisitQueue')
//     }
//     const { next, ...rest } = cast('RegularItem', this.lead.next)
//     this.lead.next = next
//     return rest
//   }
// }