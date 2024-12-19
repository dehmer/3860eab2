import assert from 'node:assert'
import * as R from 'ramda'
import { describe, it } from "vitest"

const AsyncIterator = function (fn) {
  this[Symbol.asyncIterator] = fn
}

const wrapArray = xs => async function* () {
  for (const x of xs) yield x
}

const wrapString = s => async function* () {
  for (const x of s) yield x
}

const map = R.curry((fn, it) => async function* () {
  for await (const i of it)
    yield fn(i)
})

const filter = R.curry((p, it) => async function* () {
  for await (const i of it)
    if (p(i)) yield i
})

const chain = R.curry((fn, its) => async function* () {
  for await (const it of its)
    for await (const i of fn(it))
      yield i
})

const reduce = R.curry(async (fn, init, it) => {
  let acc = init
  for await (const i of it) acc = fn(acc, i)
  return acc
})

AsyncIterator.of =
AsyncIterator['fantasy-land/of'] =
it => {
  if (Array.isArray(it)) return new AsyncIterator(wrapArray(it))
  else if (typeof it === 'string') return new AsyncIterator(wrapString(it))
  else if (it[Symbol.asyncIterator]) return new AsyncIterator(it[Symbol.asyncIterator])
  else if (it[Symbol.iterator]) return new AsyncIterator(it[Symbol.iterator])
  else throw new Error('`it` is not iterable')
}

AsyncIterator.prototype.map =
AsyncIterator.prototype['fantasy-land/map'] =
function (fn) {
  return new AsyncIterator(map(fn, this))
}

AsyncIterator.prototype.filter =
AsyncIterator.prototype['fantasy-land/filter'] =
function (fn) {
  return new AsyncIterator(filter(fn, this))
}

AsyncIterator.prototype.chain =
AsyncIterator.prototype['fantasy-land/chain'] =
function (fn) {
  return new AsyncIterator(chain(fn, this))
}

AsyncIterator.prototype.reduce =
AsyncIterator.prototype['fantasy-land/reduce'] =
function (fn, init) {
  return reduce(fn, init, this)
}

const asyncIterator = xs => ({
  [Symbol.asyncIterator]: async function* () {
    for (const x of xs) yield x
  }
})

const syncIterator = xs => ({
  [Symbol.iterator]: function* () {
    for (const x of xs) yield x
  }
})

describe('AsyncIterator', () => {
  it('AsyncIterator.of [array]', async () => {
    const expected = [0, 12, 31]
    const it = AsyncIterator.of(expected)
    const actual = (await Array.fromAsync(it))
    assert.deepStrictEqual(actual, expected)
  })

  it('AsyncIterator.of [string]', async () => {
    const expected = 'Hello, world!'
    const it = AsyncIterator.of(expected)
    const actual = (await Array.fromAsync(it)).join('')
    assert.strictEqual(actual, expected)
  })

  it('AsyncIterator.of [Symbol.asyncIterator]', async () => {
    const expected = [0, 12, 31]
    const it = AsyncIterator.of(asyncIterator(expected))
    const actual = await Array.fromAsync(it)
    assert.deepStrictEqual(actual, expected)
  })

  it('AsyncIterator.of [Symbol.iterator]', async () => {
    const expected = [0, 12, 31]
    const it = AsyncIterator.of(syncIterator(expected))
    const actual = await Array.fromAsync(it)
    assert.deepStrictEqual(actual, expected)
  })

  it('map', async () => {
    const double = x => x * 2
    const range = R.range(0, 10)
    const it = AsyncIterator.of(syncIterator(range))
    const expected = range.map(double)
    const actual = await Array.fromAsync(it.map(double))
    assert.deepStrictEqual(actual, expected)
  })

  it('filter', async () => {
    const odd = x => x % 2
    const range = R.range(0, 10)
    const it = AsyncIterator.of(syncIterator(range))
    const expected = range.filter(odd)
    const actual = await Array.fromAsync(it.filter(odd))
    assert.deepStrictEqual(actual, expected)
  })

  it('chain', async () => {
    const fill = x => AsyncIterator.of(Array(x).fill(x))
    const range = R.range(0, 10)
    const it = AsyncIterator.of(syncIterator(range))
    const expected = R.chain(x => Array(x).fill(x), range)
    const actual = await Array.fromAsync(it.chain(fill))
    assert.deepStrictEqual(actual, expected)
  })
})
