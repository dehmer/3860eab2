import assert from 'node:assert'
import { it } from "vitest"
import * as R from 'ramda'

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
const chain = R.curry((fn, xf) => step(xf, async (acc, x) => fn(x).reduce(xf['@@transducer/step'], await acc)))

const numbers = async function * (n) {
  for (let i = 0; i < n; i++) yield i
}

const AsyncIterator = function (fn) {
  this[Symbol.asyncIterator] = fn
}

AsyncIterator.of = function (...args) {
  if (args.length === 1) {
    if (typeof args[0] === 'number') return new AsyncIterator(() => numbers(args[0]))
  }
}

AsyncIterator.prototype.reduce = async function (fn, init) {
  let acc = init
  for await (const i of this) acc = fn(acc, i)
  return acc
}

AsyncIterator.prototype.transduce = async function (fn, reducer, init) {
  const xf = fn({
    '@@transducer/init': () => init,
    '@@transducer/step': (acc, x) => reducer(acc, x),
    '@@transducer/result': R.identity
  })

  const acc = await this.reduce(xf['@@transducer/step'], xf['@@transducer/init']())
  return xf['@@transducer/result'](acc)
}

const fn = R.compose(
  map(R.multiply(3)),
  map(R.add(-1)),
  filter(x => x % 2 === 0),
  map(x => x / 2),
  filter(x => x < 10),
  chain(x => AsyncIterator.of(x))
)

it('transduce :: Number[]', async () => {
  const actual = await AsyncIterator.of(10).transduce(fn, R.flip(R.append), [])
  const expected = [0, 0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 6]
  assert.deepStrictEqual(actual, expected)
})

it('transduce :: Number', async () => {
  const actual = await AsyncIterator.of(10).transduce(fn, R.add, 0)
  assert.strictEqual(actual, 27)
})
