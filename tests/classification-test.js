const miniTest = require('./mini-test')
const [test, assertEquals] = [miniTest.test, miniTest.assertEquals]

const classification = require('../src/classification')
const grouping = require('../src/grouping')
const parser = require('../src/parser')
const testUtil = require('./util')
const assertArrEquals = testUtil.assertArrEquals
const [Token, tokenType] = [parser.Token, parser.tokenType]

test(() => {
    Object.keys(grouping.displayTypes).forEach(i => {
        assertEquals(true, i !== classification.otherType)
    })
}, 'other token num collision test')

test(() => {
    let t = [new Token(0, tokenType.assignment), new Token(2, tokenType.emptyLine)]
    let arr = classification.getOtherToken(4, t)
    assertEquals(true, arr.every(t => t.type === classification.otherType))
    assertArrEquals([1, 3], arr.map(t => t.lineNum))
}, 'getOtherToken test')
