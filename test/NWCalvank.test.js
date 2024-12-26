import assert from 'node:assert'
import * as R from 'ramda'
import { it } from "vitest"

// Reference: https://www.youtube.com/embed/SJjOp0X_MVA

it('', () => {
  const fn = R.compose(
    R.multiply(2),
    R.add(1),
    R.add(1),
    R.add(1),
    R.add(1),
    R.add(1)
  )

  const actual = R.range(1, 11).map(fn)
  const expected = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30]
  assert.deepStrictEqual(actual, expected)
})

const isEven = x => x % 2 === 0
const isOdd = x => x % 2 === 1

it('', () => {
  const actual = R.range(1, 11)
    .map(R.add(1))
    .filter(isEven)
    .reduce(R.add, 0)

  assert.strictEqual(actual, 30)
})

it('', () => {
  const map = (xs, fn) =>
    xs.reduce((acc, x) =>
      R.concat(acc, [fn(x)]), [])

  const actual = map(R.range(1, 11), R.add(1))
  const expected = [2, 3, 4,  5,  6, 7, 8, 9, 10, 11]
  assert.deepStrictEqual(actual, expected)
})

it('', () => {
  const map = fn => (acc, x) => R.concat(acc, [fn(x)])
  const actual = R.range(1, 11).reduce(map(R.add(1)), [])
  const expected = [2, 3, 4,  5,  6, 7, 8, 9, 10, 11]
  assert.deepStrictEqual(actual, expected)
})

it('', () => {
  const filter = p => (acc, x) => p(x) ? R.concat(acc, [x]) : acc
  const actual = R.range(1, 11).reduce(filter(isOdd), [])
  const expected = [1, 3, 5, 7, 9]
  assert.deepStrictEqual(actual, expected)
})

it('', () => {
  const concat = (xs, x) => R.concat(xs, [x])

  const map =
    fn =>
      reducer =>
        (acc, x) =>
          reducer(acc, fn(x))

  const filter =
    p =>
      reducer =>
        (acc, x) =>
          p(x) ? reducer(acc, x) : acc

  const chain =
    fn =>
      reducer =>
        (acc, x) =>
          fn(x).reduce(reducer, acc)

  const xf = R.compose(
    map(R.add(1)),
    chain(x => Array(x).fill(x)),
    filter(isEven),
    map(R.multiply(3))
  )

  const transduce =
    (xf, reducer, init, xs) =>
      xs.reduce(xf(reducer), init)

  assert.deepStrictEqual(
    R.range(1, 11).reduce(xf(concat), []),
    transduce(xf, concat, [], R.range(1, 11))
  )

  assert.deepStrictEqual(
    R.range(1, 11).reduce(xf(R.add), 0),
    transduce(xf, R.add, 0, R.range(1, 11))
  )
})

it('transducer protocol', () => {
  const concat = (xs, x) => R.concat(xs, [x])

  const map = fn => xf => ({
    '@@transducer/init': xf['@@transducer/init'],
    '@@transducer/step': (acc, x) => xf['@@transducer/step'](acc, fn(x)),
    '@@transducer/result': xf['@@transducer/result']
  })

  const filter = p => xf => ({
    '@@transducer/init': xf['@@transducer/init'],
    '@@transducer/step': (acc, x) => p(x) ? xf['@@transducer/step'](acc, x) : acc,
    '@@transducer/result': xf['@@transducer/result']
  })

  const chain = fn => xf => ({
    '@@transducer/init': xf['@@transducer/init'],
    '@@transducer/step': (acc, x) => fn(x).reduce(xf['@@transducer/step'], acc),
    '@@transducer/result': xf['@@transducer/result']
  })

  const fn = R.compose(
    map(R.add(1)),
    chain(x => Array(x).fill(x)),
    filter(isEven),
    map(R.multiply(3))
  )

  const transduce =
    (fn, reducer, init, xs) => {
      const xf = fn({
        '@@transducer/init': () => init,
        '@@transducer/step': (acc, x) => reducer(acc, x),
        '@@transducer/result': R.identity
      })

      const acc = xs.reduce(xf['@@transducer/step'], xf['@@transducer/init']())
      return xf['@@transducer/result'](acc)
    }

  assert.deepStrictEqual(transduce(fn, concat, [], R.range(1, 11)), [
     6,  6, 12, 12, 12, 12, 18, 18, 18,
    18, 18, 18, 24, 24, 24, 24, 24, 24,
    24, 24, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30
  ])

  assert.strictEqual(transduce(fn, R.add, 0, R.range(1, 11)), 660)
})
