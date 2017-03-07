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

exports.assertArrEquals = assertArrEquals
exports.assertThrows = assertThrows
