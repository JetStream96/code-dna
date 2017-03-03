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

exports.strReplace = strReplace
exports.range = range
exports.charCount = charCount
