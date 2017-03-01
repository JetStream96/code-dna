const miniTest = require('./mini-test')
const [test, assertEquals] = [miniTest.test, miniTest.assertEquals]

const util = require('../src/util')
const range = util.range

test(() => {
    let sum = range(1, 3).reduce((x, y) => x + y)
    assertEquals(6, sum)
}, 'range test 1')

test(() => {
    let arr = range(0, 2)
    assertEquals(2, arr.length)
    assertEquals(0, arr[0])
    assertEquals(1, arr[1])
}, 'range test 2')

test(() => {
    let s = util.strReplace('123456789', [[0, 1], [4, 3]])
    assertEquals(' 234   89', s)
}, 'strReplace test')

test(() => {
    assertEquals(3, util.charCount('135233', '3'))
}, 'charCount test')