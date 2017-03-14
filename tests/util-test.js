const miniTest = require('./mini-test')
const [test, assertEquals] = [miniTest.test, miniTest.assertEquals]

const util = require('../src/util')
const range = util.range

const testUtil = require('./util')
const [assertArrEquals, assertThrows, assertNumEquals] = 
    [testUtil.assertArrEquals, testUtil.assertThrows, testUtil.assertNumEquals]

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
    let s = util.strReplace('12\n34', [[1, 2], [4, 1]])
    assertEquals('1 \n3 ', s)
}, 'strReplace multi-line test')

test(() => {
    assertEquals(3, util.charCount('135233', '3'))
}, 'charCount test')

test(() => {
    assertEquals(false, util.arrEquals([], [1, 2]))
    assertEquals(true, util.arrEquals(['a', 8], ['a', 8]))
})

test(() => {
    assertArrEquals([-8, -5, 0, 3], util.bucketSort([-5, 3, 0, -8]))
}, 'bucket sort test')

test(() => {
    let [a, b, c] = [{x:3, y:10}, {x:4, y:-5}, {x:5, y:0}]
    assertArrEquals([b, c, a], util.bucketSort([a, b, c], item => item.y))
}, 'bucket sort by property test')

test(() => {
    assertThrows(() => util.bucketSort([8.5, 4, 2]))
}, 'bucket sort not int should throw')

test(() => {
    assertEquals(6, util.sum([0, 1, 2, 3]))
    assertEquals(35, util.sum([3, -1, -5], n => n * n))
}, 'arr sum test')

test(() => {
    assertNumEquals(2, util.stdDeviation([2, 4, 4, 4, 5, 5, 7, 9]))
}, 'std deviation test')

test(() => {
    assertNumEquals(5, util.lineCount('as\nasd\r\n\r\n\na'))
})
