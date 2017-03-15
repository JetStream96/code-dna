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

/**
 * Usage: range(2, 3): [2, 3, 4], range(3): [0, 1, 2]
 * @param {*} start 
 * @param {*} count 
 */
function range(start, count) {
    if (count === undefined) {
        return range(0 ,start)
    }
    
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

/**
 * Given an array of objects, this function returns an array of buckets with type array or undefined.
 */
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

function groupBy(arr, selector=i=>i) {
    let map = new Map()
    arr.forEach(e => {
        let key = selector(e)
        let group = map[key]
        if (group === undefined) {
            map[key] = [e]
        } else {
            group.push(e)
        }
    })

    return map
}

function sum(arr, map=i=>i) {
    return arr.reduce((s, x) => s + map(x), 0)
}

function stdDeviation(arr) {
    let n = arr.length
    let avg = sum(arr) / n
    return Math.sqrt(sum(arr, e => (e - avg) * (e - avg)) / n)
}

function lineCount(text) {
    return text.split(/\r?\n/g).length
}

exports.strReplace = strReplace
exports.range = range
exports.charCount = charCount
exports.arrEquals = arrEquals
exports.bucketSort = bucketSort
exports.putIntoBuckets = putIntoBuckets
exports.groupBy = groupBy
exports.sum = sum
exports.stdDeviation = stdDeviation
exports.lineCount = lineCount
