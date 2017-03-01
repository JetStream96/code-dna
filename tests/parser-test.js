const miniTest = require('./mini-test')
const [test, assertEquals] = [miniTest.test, miniTest.assertEquals]

const parser = require('../src/parser')

test(() => {
    let s = '123\n4\n56'
    assertEquals(1, parser.lineNum(s, 0))
    assertEquals(2, parser.lineNum(s, 4))
    assertEquals(3, parser.lineNum(s, 6))
}, 'line number test')

test(() => {
    let s = "12a213a"
    let matches = [...parser.reMatches(s, /\da/g)]
    assertEquals(2 + 1, matches.length)
    assertEquals('2a', matches[1][0])
    assertEquals('3a', matches[2][0])
    assertEquals(1, matches[1]['index'])
    assertEquals(5, matches[2]['index'])
}, 'reMatches test')
