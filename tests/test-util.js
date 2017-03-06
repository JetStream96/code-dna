const miniTest = require('./mini-test')
const util = require('../src/util')

function assertArrEquals(expected, actual) {
    miniTest.assertEquals(true, util.arrEquals(expected, actual))
}

exports.assertArrEquals = assertArrEquals
