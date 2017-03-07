const miniTest = require('../tests/mini-test')

/**
 * For all characters specified in indexLengthPairs, if it is not \n, it's replaced with space.
 * @param {string} str
 * @param {[number, number][]} indexLengthPairs
 */
function strReplace(str, indexLengthPairs) {
    let arr = [...str]
    indexLengthPairs.forEach(p => {
        [index, len] = p
        range(index, len).forEach(i => {
            if (arr[i] != '\n') {
                arr[i] = ' '
            }
        })
    })
    return arr.join('')
}

function* rangeIter(start, count) {
    if (count < 0) {
        throw new Error('count cannot be negative.')
    }

    for (let n = start; n < start + count; n++) {
        yield n
    }
}

function range(start, count) {
    return [...rangeIter(start, count)]
}

function charCount(str, char) {
    let c = 0
    for (let i of str) {
        if (i === char) {
            c++
        }
    }
    return c
}

function arrEquals(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false
    }

    return arr1.every((e, i) => e === arr2[i])
}

/**
 * @param {[]} arr
 * @returns {[]} sorted array
 */
function bucketSort(arr, sortBy=i=>i) {
    let buckets = putIntoBuckets(arr, sortBy)
    return [].concat(...buckets.filter(b => b !== undefined))
}

function putIntoBuckets(arr, sortBy=i=>i) {
    let prop = arr.map(e => sortBy(e))
    if (!prop.every(e => Number.isInteger(e))) {
        throw new Error('This method can only sort by integer.')
    }

    let min = Math.min(...prop)
    let max = Math.max(...prop)
    let buckets = new Array(max - min + 1)

    let insert = elem => {
        let index = sortBy(elem) - min
        let b = buckets[index]
        if (b === undefined) {
            buckets[index] = [elem]
        } else {
            b.push(elem)
        }
    }

    arr.forEach(e => insert(e))
    return buckets
}

exports.strReplace = strReplace
exports.range = range
exports.charCount = charCount
exports.arrEquals = arrEquals
exports.bucketSort = bucketSort
exports.putIntoBuckets = putIntoBuckets
