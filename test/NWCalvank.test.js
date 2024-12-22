import * as R from 'ramda'
import { describe, it } from "vitest"

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
  console.log(actual)
})

const isEven = x => x % 2 === 0
const isOdd = x => x % 2 === 1

it('', () => {
  const actual = R.range(1, 11)
    .map(R.add(1))
    .filter(isEven)
    .reduce(R.add, 0)

  console.log(actual)
})

it('', () => {
  const map = (xs, fn) =>
    xs.reduce((acc, x) => R.concat(acc, [fn(x)]), [])

  const actual = map(R.range(1, 11), R.add(1))
  console.log(actual)
})

it('', () => {
  const map = fn => (acc, x) => R.concat(acc, [fn(x)])
  const actual = R.range(1, 11).reduce(map(R.add(1)), [])
  console.log(actual)
})

it('', () => {
  const filter = p => (acc, x) => p(x) ? R.concat(acc, [x]) : acc
  const actual = R.range(1, 11).reduce(filter(isOdd), [])
  console.log(actual)
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

  console.log(R.range(1, 11).reduce(xf(concat), []))
  console.log(R.range(1, 11).reduce(xf(R.add), 0))
  console.log(transduce(xf, R.add, 0, R.range(1, 11)))
  console.log(transduce(xf, concat, [], R.range(1, 11)))
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

    console.log(transduce(fn, concat, [], R.range(1, 11)))
    console.log(transduce(fn, R.add, 0, R.range(1, 11)))
})

it('transducer protocol', () => {
  const concat = (xs, x) => R.concat(xs, [x])

  const step = (xf, fn) => ({
    '@@transducer/init': xf['@@transducer/init'],
    '@@transducer/result': xf['@@transducer/result'],
    '@@transducer/step': fn
  })

  const map = fn => xf => step(xf, (acc, x) => xf['@@transducer/step'](acc, fn(x)))
  const filter = p => xf => step(xf, (acc, x) => p(x) ? xf['@@transducer/step'](acc, x) : acc)
  const chain = fn => xf => step(xf, (acc, x) => fn(x).reduce(xf['@@transducer/step'], acc))

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

    console.log(transduce(fn, concat, [], R.range(1, 11)))
    console.log(transduce(fn, R.add, 0, R.range(1, 11)))
})