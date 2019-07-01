/**
 * Algorithms to work on COMPITA-2019 verbose tree
 * 
 * The verbose tree is the one defined by the original grammar
 */

import { SyntaxTree, isToken } from "./definitions";


export function RepeatUntilUnchanged<T>(funct: (subject: T, markChanged: () => any) => T, subject: T): void {
  let changed: boolean;
  const markChanged = () => {
    changed = true;
  };
  do {
    changed = false;
    subject = funct(subject, markChanged);
  } while (changed as boolean === true);
}

export function DFS(
  executor: (node: SyntaxTree, stop: () => any) => any,
  tree: SyntaxTree
) {
  type Queue = { node: SyntaxTree, next: Queue | null }
  let queueStart: Queue = { node: tree, next: null }
  let queueEnd: Queue = queueStart
  let shouldStop: boolean = false
  function stop() {
    shouldStop = true
  }
  while (!shouldStop && queueStart !== null) {
    executor(queueStart.node, stop)
    queueStart.node.nodeChildren.forEach(child => {
      if (isToken(child)) {
        return
      }
      queueEnd.next = { node: child, next: null }
      queueEnd = queueEnd.next
    })
    queueStart = queueStart.next as Queue
  }
}

export function Flatten(targetNodeNames: string[], subject: SyntaxTree) {
  RepeatUntilUnchanged((obj, markChanged) => {
    DFS((node, stop) => {
      const insertions: { index: number, node: SyntaxTree }[] = []
      node.nodeChildren.forEach((child, index) => {
        if (isToken(child)) {
          return
        }
        if (!(
          targetNodeNames.includes(child.nodeName)
          && targetNodeNames.includes(node.nodeName))) {
          return
        }
        markChanged()
        stop()
        if (insertions.length === 0) {
          insertions.push({ index, node: child })
        } else {
          insertions.push({
            index: index + insertions[insertions.length - 1].node.nodeChildren.length - 1,
            node: child
          })
        }
      })
      insertions.forEach(
        insertion => node.nodeChildren.splice(
          insertion.index,
          1,
          ...insertion.node.nodeChildren)
      )
    }, obj)
    return obj
  }, subject)
}

export function TreeShake(tree: SyntaxTree) {
  // de-nest lists so they become one-level, this easier to iterate
  Flatten(['DeclList'], tree)
  Flatten(['ElemList'], tree)
  Flatten(['DimList'], tree)
  Flatten(['FuncList'], tree)
  Flatten(['ParamList'], tree)
  Flatten(['StatList'], tree)
  Flatten(['ReadList'], tree)
  Flatten(['WriteList'], tree)
  Flatten(['ExprList'], tree)
  Flatten(['SubscrList'], tree)
  /* Flatten(['ExprList', 'Expression'], tree)
  Flatten([
    'Expression',
    'AuxExpr1',
    'AuxExpr2',
    'AuxExpr3',
    'AuxExpr4',
    'Term',
    'Factor'
  ], tree)
  Flatten(['SubscrList', 'AuxExpr4'], tree) // refer to last grammar production */
  // Flatten(['CompStat'], tree) // does not work
  return tree
}
