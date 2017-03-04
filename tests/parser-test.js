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
    let matches = parser.reMatches(s, /\da/g)
    assertEquals(2, matches.length)
    assertEquals('2a', matches[0][0])
    assertEquals('3a', matches[1][0])
    assertEquals(1, matches[0]['index'])
    assertEquals(5, matches[1]['index'])
}, 'reMatches test')

test(() => {
    let [newTxt, tokens] = parser.parseComments('var c = 10; // xyz')
    assertEquals('var c = 10;       ', newTxt)
    assertEquals(1, tokens.length)
    
    let t = tokens[0]
    assertEquals('// xyz'.length, t.length)
    assertEquals(1, t.lineSpan)
}, 'parseComments, single line, type 1')

test(() => {
    let [newTxt, tokens] = parser.parseComments('var c = 10; /* xyz */')
    assertEquals('var c = 10;          ', newTxt)
    assertEquals(1, tokens.length)
    
    let t = tokens[0]
    assertEquals('/* xyz */'.length, t.length)
    assertEquals(1, t.lineSpan)
}, 'parseComments, single line, type 2')

test(() => {
    let s = `var c = 10; /*
    comments`
    let [newTxt, tokens] = parser.parseComments(s)
    assertEquals(`var c = 10;   
            `, newTxt)
    assertEquals(1, tokens.length)
    
    let t = tokens[0]
    assertEquals(`/*
    comments`.length, t.length)
    assertEquals(2, t.lineSpan)
}, 'parseComments, unclosed multi-line comments, type 2')

test(() => {
    let [newTxt, tokens] = parser.parseComments(`var c = 10; /* // xyz
    123  */
    var d = 0;
    // xyz`)

    assertEquals(`var c = 10;          
           
    var d = 0;
          `, newTxt)
    assertEquals(2, tokens.length)
    
    let t0 = tokens[0]
    assertEquals(`/* // xyz
    123  */`.length, t0.length)
    assertEquals(2, t0.lineSpan)
    assertEquals(1, t0.lineNum)

    let t1 = tokens[1]
    assertEquals('// xyz'.length, t1.length)
    assertEquals(1, t1.lineSpan)
    assertEquals(4, t1.lineNum)
}, 'parseComments, mixed types')

test(() => {
    let s = `var s = "xyz\\"";` // Escaped backslash. Actually is: var s = "xyz\"";
    let [newTxt, tokens] = parser.parseStringLiterals(s)
    assertEquals(`var s = "     ";`, newTxt)
    assertEquals(1, tokens.length)

    let t = tokens[0]
    assertEquals(`"xyz\\""`.length, t.length)
    assertEquals(1 , t.lineNum)
    assertEquals(1, t.lineSpan)
    assertEquals(parser.TokenType.stringLiteral, t.type)
}, 'basic string literal test')

test(() => {
    let [newTxt, tokens] = parser.parseStringLiterals(`var s = @"xyz""
    1";`)
    assertEquals(`var s = @"     
     ";`, newTxt)
    assertEquals(1, tokens.length)

    let t = tokens[0]
    assertEquals(`@"xyz""
    1"`.length, t.length)
    assertEquals(1 , t.lineNum)
    assertEquals(2, t.lineSpan)
    assertEquals(parser.TokenType.stringLiteral, t.type)
}, 'verbatim string test')

test(() => {
    let s = `var s = $"xyz\\"1";` // Escaped backslash. Actually is: var s = $"xyz\"1";
    let [newTxt, tokens] = parser.parseStringLiterals(s)
    assertEquals(`var s = $"      ";`, newTxt)
    assertEquals(1, tokens.length)

    let t = tokens[0]
    assertEquals(`$"xyz\\"1"`.length, t.length)
    assertEquals(1 , t.lineNum)
    assertEquals(1, t.lineSpan)
    assertEquals(parser.TokenType.stringLiteral, t.type)
}, 'verbatim string test')

test(() => {
    let s = `
var s = $"xyz\\"1";
s = "";
s = @"
";
s = $"";` 
    let [newTxt, tokens] = parser.parseStringLiterals(s)
    assertEquals(4, tokens.length)

    assertEquals(`$"xyz\\"1"`.length, tokens[0].length)
    assertEquals(2, tokens[1].length)
    assertEquals(4, tokens[2].length)
    assertEquals(3, tokens[3].length)
}, 'mixed strings and empty strings test')
