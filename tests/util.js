const miniTest = require('./mini-test')
const util = require('../src/util')

function assertArrEquals(expected, actual) {
    miniTest.assertEquals(true, util.arrEquals(expected, actual))
}

function assertThrows(action) {
    let throws = false
    try {
        action();
    } catch (e) {
        throws = true
    }

    if (!throws) {
        throw new Error('The given action does not throw error.')
    }
}

function assertNumEquals(expected, actual, delta=1E-7) {
    miniTest.assertEquals(true, Math.abs(expected - actual) <= delta)
}

exports.assertArrEquals = assertArrEquals
exports.assertThrows = assertThrows
exports.assertNumEquals = assertNumEquals
