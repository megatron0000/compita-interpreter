// procedures for working on the abstract tree (AST) for COMPITA-2019

import { ASTNode, ASTNodeKinds } from "./definitions";

export interface FindRules<T extends keyof ASTNodeKinds> {
  kind: T | T[],
  /**
   * If `true`, then not the entire subtree will be searched. The search
   * will be only among the direct children on the top node
   */
  directlyUnder?: boolean
}

function Children(node: ASTNode): ASTNode[] {
  return Object.keys(node)
    .map(x => node[x])
    .filter(maybeChild => {
      if (!maybeChild) {
        return false
      }

      if (maybeChild.kind) {
        return true
      }

      if (Array.isArray(maybeChild) && maybeChild.length > 0 && maybeChild[0] && maybeChild[0].kind) {
        return true
      }
    })
    .reduce((previous, current) => {
      if (Array.isArray(current)) {
        previous = previous.concat(current)
      } else {
        previous.push(current)
      }
      return previous
    }, [])
}

type TopologicalMap = Map<ASTNode, number>

/**
 * 
 * @returns Map in which lower numbers correspond to higher positions on the tree
 */
function TopologicalMap(tree: ASTNode, startNumber = 0): TopologicalMap {

  if (TopologicalMap.cache.has(tree)) {
    return TopologicalMap.cache.get(tree) as TopologicalMap
  }

  const result: Map<ASTNode, number> = new Map()

  result.set(tree, startNumber++)

  Children(tree).forEach(child => {
    const submap = TopologicalMap(child, startNumber)
    submap.forEach((value, key) => result.set(key, value))
    startNumber += submap.size
  })

  TopologicalMap.cache.set(tree, result)
  return result
}

TopologicalMap.cache = new Map<ASTNode, TopologicalMap>()

/**
 * @returns list sorted by dependence: if element `a` comes before `b`, there is the guarantee
 * that `a` is *NOT* a child (either directly or indirectly) of `b`
 */
export function Find<T extends keyof ASTNodeKinds>(tree: ASTNode, rules: FindRules<T>): ASTNodeKinds[T][] {
  const topology = TopologicalMap(tree)
  return find(tree, rules).sort((a, b) => (topology.get(a) || 0) < (topology.get(b) || 0) ? -1 : 1)
}

/**
 * Helper for Find. Does not sort based on tree precedence
 */
function find<T extends keyof ASTNodeKinds>(tree: ASTNode, rules: FindRules<T>): ASTNodeKinds[T][] {
  let result: ASTNodeKinds[T][] = []

  if (Array.isArray(rules.kind)) {
    rules.kind
      .map(oneKind => Find(tree, { ...rules, kind: oneKind }))
      .forEach(findResults => result = result.concat(findResults))

    return result
  }

  if (tree.kind === rules.kind) {
    result.push(tree as unknown as ASTNodeKinds[T])
  }

  if (rules.directlyUnder) {
    result = result.concat(Children(tree).filter(child => child.kind === rules.kind) as ASTNodeKinds[T][])
    return result
  }

  Children(tree)
    .map(child => Find(child, rules))
    .forEach(partialFind => result = result.concat(partialFind as unknown as ASTNodeKinds[T][]))

  return result
}
