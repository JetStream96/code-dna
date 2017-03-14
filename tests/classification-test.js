const miniTest = require('./mini-test')
const [test, assertEquals] = [miniTest.test, miniTest.assertEquals]

const classification = require('../src/classification')
const parser = require('../src/parser')
const grouping = require('../src/grouping')
const testUtil = require('./util')
const assertArrEquals = testUtil.assertArrEquals
const [Token, tokenType] = [parser.Token, parser.tokenType]

test(() => {
    let t = [new Token(0, tokenType.assignment), new Token(2, tokenType.emptyLine)]
    let arr = classification.getOtherToken(4, t)
    assertEquals(true, arr.every(t => t.type === grouping.displayTypes.other))
    assertArrEquals([1, 3], arr.map(t => t.lineNum))
}, 'getOtherToken test')
