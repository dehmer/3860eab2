import assert from 'node:assert'
import { it } from "vitest"
import * as R from 'ramda'


const concat = (acc, x) => acc.concat([x])

const isTransformer =
  obj =>
    obj != null && typeof obj['@@transducer/step'] === 'function'

const step = (xf, fn) => ({
  '@@transducer/init': xf['@@transducer/init'],
  '@@transducer/result': xf['@@transducer/result'],
  '@@transducer/step': fn
})

const map = R.curry((fn, xf) => step(xf, (acc, x) => xf['@@transducer/step'](acc, fn(x))))
const filter = R.curry((p, xf) => step(xf, (acc, x) => p(x) ? xf['@@transducer/step'](acc, x) : acc))
const chain = R.curry((fn, xf) => step(xf, (acc, x) => fn(x).reduce(xf['@@transducer/step'], acc)))


const transduce = (fn, reducer, init, xs) => {
  const xf = fn({
    '@@transducer/init': () => init,
    '@@transducer/step': (acc, x) => reducer(acc, x),
    '@@transducer/result': R.identity
  })

  const acc = xs.reduce(xf['@@transducer/step'], xf['@@transducer/init']())
  return xf['@@transducer/result'](acc)
}

const numbers = function * (n) {
  for (let i = 0; i < n; i++) yield i
}

const Iterator = function (fn) {
  this[Symbol.iterator] = fn
}

Iterator.of = function (...args) {
  if (args.length === 1) {
    if (typeof args[0] === 'number') return new Iterator(() => numbers(args[0]))
  }
}

Iterator.prototype.reduce = function (fn, init) {
  let acc = init
  for (const i of this) acc = fn(acc, i)
  return acc
}

Iterator.prototype.transduce = function (fn, reducer, init) {
  const xf = fn({
    '@@transducer/init': () => init,
    '@@transducer/step': (acc, x) => reducer(acc, x),
    '@@transducer/result': R.identity
  })

  const acc = this.reduce(xf['@@transducer/step'], xf['@@transducer/init']())
  return xf['@@transducer/result'](acc)
}

const fn = R.compose(
  map(R.multiply(3)),        // [0,  3,  6,  9, 12, 15, 18, 21, 24, 27]
  map(R.add(-1)),            // [-1,  2,  5,  8, 11, 14, 17, 20, 23, 26]
  filter(x => x % 2 === 0),  // [2, 8, 14, 20, 26]
  map(x => x / 2),           // [1, 4, 7, 10, 13]
  filter(x => x < 10),       // [1, 4, 7]
  chain(x => Iterator.of(x)) // [0, 0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6]
)

it('transduce :: Number[]', () => {
  const actual = Iterator.of(10).transduce(fn, R.flip(R.append), [])
  const expected = [0, 0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6]
  assert.deepStrictEqual(actual, expected)
})

it('transduce :: Number', () => {
  const actual = Iterator.of(10).transduce(fn, R.add, 0)
  assert.strictEqual(actual, 27)
})

it('R.transduce [map]', () => {
  const actual = R.transduce(R.map(R.add(1)), concat, [], Iterator.of(10))
  const expected = [1, 2, 3, 4,  5, 6, 7, 8, 9, 10]
  assert.deepStrictEqual(actual, expected)
})

it('R.transduce [filter]', () => {
  const actual = R.transduce(R.filter(x => x % 2 === 1), concat, [], Iterator.of(10))
  const expected = [1, 3, 5, 7, 9]
  assert.deepStrictEqual(actual, expected)
})
