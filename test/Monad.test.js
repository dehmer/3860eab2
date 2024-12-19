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

const map = R.curry((fn, it) => ({
  [Symbol.asyncIterator]: async function* () {
    for await (const i of it)
      yield fn(i)
  }
}))

const filter = R.curry((p, it) => ({
  [Symbol.asyncIterator]: async function* () {
    for await (const i of it)
      if (p(i)) yield i
  }
}))

const chain = R.curry((fn, its) => ({
  [Symbol.asyncIterator]: async function* () {
    for await (const it of its)
      for await (const i of fn(it))
        yield i
  }
}))

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
  return AsyncIterator.of(map(fn, this))
}

AsyncIterator.prototype.filter =
AsyncIterator.prototype['fantasy-land/filter'] =
function (fn) {
  return AsyncIterator.of(filter(fn, this))
}

AsyncIterator.prototype.chain =
AsyncIterator.prototype['fantasy-land/chain'] =
function (fn) {
  return AsyncIterator.of(chain(fn, this))
}

AsyncIterator.prototype.reduce =
AsyncIterator.prototype['fantasy-land/reduce'] =
function (fn, init) {
  return reduce(fn, init, this)
}

const syncNumbers = n => ({
  [Symbol.iterator]: function* () {
    for (let i = 0; i < n; i++) yield i
  }
})

const asyncNumbers = n => ({
  [Symbol.asyncIterator]: async function* () {
    for (let i = 0; i < n; i++) yield i
  }
})

it.only('xxx', async () => {
  // console.log(new AsyncIterator(syncNumbers(10)))
  const it = AsyncIterator.of(syncNumbers(10))
  // const it = AsyncIterator.of(asyncNumbers(10)).map(x => x * 3).filter(x => x % 2)
  // const it = AsyncIterator.of('hello, world!')

  // const it = AsyncIterator.of(asyncNumbers(10))
  //   .chain(x => asyncNumbers(x + 1))
  //   .map(x => x * 3)
  //   .filter(x => x % 2)

  // const it = R.map(x => x * 3, AsyncIterator.of(asyncNumbers(10)))
  // const it = R.filter(x => x % 2, AsyncIterator.of(asyncNumbers(10)))
  // const it = R.chain(x => asyncNumbers(x), AsyncIterator.of(asyncNumbers(10)))

  // const it = AsyncIterator.of([23, 21, 42])
  for await (const x of it) console.log(x)
  // for await (const x of it) console.log(x)
  // for await (const x of it) console.log(x)
  // for await (const x of it) console.log(x)
  // for await (const x of AsyncIterator.of(syncNumbers(10))) console.log(x)

})