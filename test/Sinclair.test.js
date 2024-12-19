import * as R from 'ramda'
import { describe, it } from "vitest"

const victorianSlang = [
  {
    term: 'doing the bear',
    found: true,
    popularity: 108,
  },
  {
    term: 'katterzem',
    found: false,
    popularity: null,
  },
  {
    term: 'bone shaker',
    found: true,
    popularity: 609,
  },
  {
    term: 'smothering a parrot',
    found: false,
    popularity: null,
  },
  {
    term: 'damfino',
    found: true,
    popularity: 232,
  },
  {
    term: 'rain napper',
    found: false,
    popularity: null,
  },
  {
    term: 'donkey’s breakfast',
    found: true,
    popularity: 787,
  },
  {
    term: 'rational costume',
    found: true,
    popularity: 513,
  },
  {
    term: 'mind the grease',
    found: true,
    popularity: 154,
  }
]

describe('MAGICAL, MYSTICAL JAVASCRIPT TRANSDUCERS', () => {
  it('naive', () => {
    const add = ({ totalPopularity, itemCount }, popularity) => ({
      totalPopularity: totalPopularity + popularity,
      itemCount: itemCount + 1
    })

    const { totalPopularity, itemCount } = victorianSlang
      .filter(R.prop('found'))
      .map(R.prop('popularity'))
      .reduce(add, { totalPopularity: 0, itemCount: 0 })

    const averagePopularity = totalPopularity / itemCount
    console.log("Average popularity", averagePopularity)
  })

  it('reduce only', () => {
    const reduceFound = (acc, item) => item.found ? acc.concat([item]) : acc
    const reducePopularity = (acc, item) => acc.concat([item.popularity])
    const sumPopularity = ({ totalPopularity, itemCount }, popularity) => ({
      totalPopularity: totalPopularity + popularity,
      itemCount: itemCount + 1
    })

    const { totalPopularity, itemCount } = victorianSlang
      .reduce(reduceFound, [])
      .reduce(reducePopularity, [])
      .reduce(sumPopularity, { totalPopularity: 0, itemCount: 0 })

    const averagePopularity = totalPopularity / itemCount
    console.log("Average popularity", averagePopularity)
  })

  it('reducer factories', () => {
    const filterReducer = p => (acc, x) => p(x) ? acc.concat([x]) : acc
    const mapReducer = fn => (acc, x) => acc.concat([fn(x)])
    const sumPopularity = ({ totalPopularity, itemCount }, popularity) => ({
      totalPopularity: totalPopularity + popularity,
      itemCount: itemCount + 1
    })

    const { totalPopularity, itemCount } = victorianSlang
      .reduce(filterReducer(R.prop('found')), [])
      .reduce(mapReducer(R.prop('popularity')), [])
      .reduce(sumPopularity, { totalPopularity: 0, itemCount: 0 })

    const averagePopularity = totalPopularity / itemCount
    console.log("Average popularity", averagePopularity)
  })

  it('transducer', () => {
    // Reducer :: (acc, x) -> acc
    // Transducer => Reducer -> Reducer

    const filterTransducer =
      p =>
        nextReducer =>
          (acc, item) => p(item) ? nextReducer(acc, item) : acc


    const mapTransducer =
      fn =>
        nextReducer =>
          (acc, item) => nextReducer(acc, fn(item))

    const sumPopularity = ({ totalPopularity, itemCount }, popularity) => ({
      totalPopularity: totalPopularity + popularity,
      itemCount: itemCount + 1,
    })

    const foundFilterTransducer = filterTransducer(R.prop('found'))
    const scoreMappingTransducer = mapTransducer(R.prop('popularity'))
    const allInOneReducer = foundFilterTransducer(scoreMappingTransducer(sumPopularity))
    const { totalPopularity, itemCount } = victorianSlang
      .reduce(allInOneReducer, { totalPopularity: 0, itemCount: 0 })

    const averagePopularity = totalPopularity / itemCount
    console.log("Average popularity", averagePopularity)
  })

  it('ramda', () => {
    const filterAndExtract = R.compose(
      R.filter(R.prop('found')),
      R.map(R.prop('popularity'))
    )
    const initVal = { totalPopularity: 0, itemCount: 0 }
    const sumPopularity = ({ totalPopularity, itemCount }, popularity) => ({
      totalPopularity: totalPopularity + popularity,
      itemCount: itemCount + 1
    })

    const {totalPopularity, itemCount} = R.transduce(
      filterAndExtract,
      sumPopularity,
      initVal,
      victorianSlang
    )

    const averagePopularity = totalPopularity / itemCount
    console.log("Average popularity", averagePopularity)
  })

  it('ramda/transformer', () => {
    const transformer = {
      '@@transducer/step': (acc, value) => {
        console.log('@@transducer/step', acc, value)
        return value
      },
      '@@transducer/result': value => {
        console.log('@@transducer/result', value)
        return value
      }
    }

    const actual = R.transduce(
      R.map(x => x * 2),
      transformer,
      undefined,
      [1, 2, 3, 4]
    )

    console.log('actual', actual)
  })
})