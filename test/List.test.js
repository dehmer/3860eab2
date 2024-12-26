import assert from 'node:assert'
import { it } from "vitest"
import * as R from 'ramda'

const isEven = x => x % 2 === 0
const isOdd = x => x % 2 === 1
const concat = (xs, x) => R.concat(xs, [x])

const isTransformer =
  obj =>
    obj != null && typeof obj['@@transducer/step'] === 'function'

const step = (xf, fn) => ({
  '@@transducer/init': xf['@@transducer/init'],
  '@@transducer/result': xf['@@transducer/result'],
  '@@transducer/step': fn
})

const map = R.curry((fn, xf) =>
  isTransformer(xf)
    ? step(xf, (acc, x) => xf['@@transducer/step'](acc, fn(x)))
    : xf.map(fn)
)

const filter = R.curry((p, xf) =>
  isTransformer(xf)
    ? step(xf, (acc, x) => p(x) ? xf['@@transducer/step'](acc, x) : acc)
    : xf.filter(p)
)

const chain = R.curry((fn, xf) =>
  isTransformer(xf)
    ? step(xf, (acc, x) => fn(x).reduce(xf['@@transducer/step'], acc))
    : xf.flatMap(fn)
)

const List = function (xs) {
  this.xs = xs
}

List.fromRange = function (from, to) {
  return new List(R.range(from, to))
}

List.prototype.map = function (fn) {
  return new List(map(fn, this.xs))
}

List.prototype.filter = function (p) {
  return new List(filter(p, this.xs))
}

List.prototype.chain = function (fn) {
  return new List(chain(fn, this.xs))
}

List.prototype.reduce = function (reducer, init) {
  return this.xs.reduce(reducer, init)
}

const transduce = (fn, reducer, init, xs) => {
  const xf = fn({
    '@@transducer/init': () => init,
    '@@transducer/step': (acc, x) => reducer(acc, x),
    '@@transducer/result': R.identity
  })

  const acc = xs.reduce(xf['@@transducer/step'], xf['@@transducer/init']())
  return xf['@@transducer/result'](acc)
}

it('map :: (a -> b) -> List a -> List b', () => {
  const actual = List.fromRange(0, 10).map(R.add(1))
  const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  assert.deepStrictEqual(actual.xs, expected)
})

it('filter :: (a -> boolean) -> List a -> List a', () => {
  const actual = List.fromRange(0, 10).filter(isOdd)
  const expected = [1, 3, 5, 7, 9]
  assert.deepStrictEqual(actual.xs, expected)
})

it('chain :: (a -> b[]) -> List a -> List b', () => {
  const actual = List.fromRange(0, 5).chain(x => Array(x).fill(x))
  const expected = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
  assert.deepStrictEqual(actual.xs, expected)
})

const fn = R.compose(
  map(R.add(1)),
  chain(x => new List(Array(x).fill(x))),
  filter(isEven),
  map(R.multiply(3)),
  chain(x => [x])
)

it('transduce :: a[]', () => {
  const actual = transduce(fn, concat, [], List.fromRange(1, 11))
  const expected = [
      6,  6, 12, 12, 12, 12, 18, 18, 18,
    18, 18, 18, 24, 24, 24, 24, 24, 24,
    24, 24, 30, 30, 30, 30, 30, 30, 30,
    30, 30, 30
  ]

  assert.deepStrictEqual(actual, expected)
})

it('transduce :: Number', () => {
  const actual = transduce(fn, R.add, 0, List.fromRange(1, 11))
  const expected = 660
  assert.deepStrictEqual(actual, expected)
})
