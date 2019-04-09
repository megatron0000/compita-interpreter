import { xor, expose_global, flip_bit, plus } from '../common'
import { predicate1, predicate2, predicate3, predicate4, lex5 } from './lexer'

function test_predicate(parameters: {
    alphabet: string[]
    expected_predicate: (input: string) => boolean
    test_predicate: (input: string) => boolean
    maxlength: number
    additional_inputs?: string[]
}) {
    const failures: string[] = []
    const queue: string[] = []
    parameters.alphabet.forEach(el => queue.push(el))
    // testar as cadeias mais curtas
    for (let round = 0; round < parameters.maxlength; round++) {
        // tira uma string da fila e coloca mais duas com tamanho maior
        const current = queue.shift() as string
        parameters.alphabet.forEach(el => queue.push(current + el))
        // testa string atual
        const expected_result = parameters.expected_predicate(current)
        const actual_result = parameters.test_predicate(current)
        if (actual_result !== expected_result) {
            failures.push(current)
        }
    }
    for (let current of parameters.additional_inputs || []) {
        const expected_result = parameters.expected_predicate(current)
        const actual_result = parameters.test_predicate(current)
        if (actual_result !== expected_result) {
            failures.push(current)
        }
    }
    return failures
}

export function test1() {
    return test_predicate({
        alphabet: ['0', '1', '\n', 'a'],
        expected_predicate: el =>
            el.split('').every(el => ['0', '1'].includes(el)) &&
            el
                .split('')
                .reduce(
                    (state, char) => [xor(state[0], char === '0'), xor(state[1], char === '1')],
                    [true, true]
                )
                .reduce((previous, current) => previous || current),
        test_predicate: predicate1,
        maxlength: 10000
    })
}

export function test2() {
    return test_predicate({
        alphabet: ['0', '1', '\n', 'a'],
        expected_predicate: el =>
            el.split('').every(el => ['0', '1'].includes(el)) &&
            el
                .split('')
                .reduce(
                    (state, char) => [xor(state[0], char === '0'), xor(state[1], char === '1')],
                    [false, false]
                )
                .reduce((previous, current) => previous && current),
        test_predicate: predicate2,
        maxlength: 10000
    })
}

export function test3() {
    return test_predicate({
        alphabet: ['0', '1', '2', '\n', 'a'],
        expected_predicate: input =>
            input.split('').every(el => ['0', '1', '2'].includes(el)) &&
            input
                .split('')
                .reduce((previous, current) => (current === '2' ? previous + 1 : previous), 0) %
                5 ===
                0,
        test_predicate: predicate3,
        maxlength: 100000,
        additional_inputs: ['0222220122222000a', '0222220122222000\n', '0222220122222000']
    })
}

export function test4() {
    return test_predicate({
        alphabet: ['0', '1', 'a', '\n'],
        expected_predicate: input =>
            input.split('').every(el => ['0', '1'].includes(el)) &&
            input.length >= 5 &&
            input
                .split('')
                .map((_, index, array) =>
                    array
                        .slice(index, index + 5)
                        .map(flip_bit)
                        .reduce(plus)
                )
                .every(el => el <= 2),
        test_predicate: predicate4,
        maxlength: 100000
    })
}

export function test5(inputstring: string) {
    return lex5(inputstring)
}

expose_global('test1', test1)
expose_global('test2', test2)
expose_global('test3', test3)
expose_global('test4', test4)
expose_global('test5', test5)