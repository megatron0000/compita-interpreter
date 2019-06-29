export function empty_string() {
  return ''
}

export function xor(left, right) {
  return (left && !right) || (right && !left)
}

// para poder retirar se não estivermos no modo debug
const exported_globals: any[] = []

export function expose_global(name: string, obj: any) {
  if (window[name]) {
    throw new Error('Tried to reset global variable ' + name)
  }
  window[name] = obj
  exported_globals.push(name)
}

export function flip_bit(bit: string | number): number {
  if (bit === '0' || bit === 0) {
    return 1
  } else if (bit === '1' || bit === 1) {
    return 0
  }
  throw new Error(bit + ' is not a bit. Cannot flip it')
}

export function plus(left: number, right: number) {
  return left + right
}

export function repeat(msg: string, times: number) {
  let out = ''
  for (let i = 0; i < times; i++) {
    out += msg
  }
  return out
}

export function assertNotNull<T>(obj: T): NonNullable<T> {
  if (!obj) {
    throw new Error('assertNotNull failed')
  }

  return obj as NonNullable<T>
}

export function Flatten<T>(array: T[][][]): T[]
export function Flatten<T>(array: T[][]): T[]
export function Flatten<T>(array: T[]): T[]
export function Flatten(array: any) {
  let result: any[] = []

  array.forEach(elem => {
    if (Array.isArray(elem)) {
      result = result.concat(Flatten(elem))
    } else {
      result.push(elem)
    }
  })

  return result
}

export function Listify<T extends any[]>(something: T): T
export function Listify<T>(something: T): [T]
export function Listify<T>(something: T) {
  if (Array.isArray(something)) {
    return something
  }
  return [something]
}
