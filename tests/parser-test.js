const miniTest = require('./mini-test')
const [test, assertEquals] = [miniTest.test, miniTest.assertEquals]

const parser = require('../src/parser')
const util = require('../src/util')
const testUtil = require('./util')
const assertArrEquals = testUtil.assertArrEquals

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
    assertEquals(parser.tokenType.stringLiteral, t.type)
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
    assertEquals(parser.tokenType.stringLiteral, t.type)
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
    assertEquals(parser.tokenType.stringLiteral, t.type)
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

test(() => {
    let s = `
    if(x == 0) 
    {
        return 0;
    }
    else if (x >= -5) 
    {
        return x + 10;
    } 
    else 
    {
        return x - 10;
    }`

    let tokens = parser.parseIfElse(s)
    assertEquals(3, tokens.length)

    let [t0, t1, t2] = tokens
    assertEquals(2, t0.lineNum)
    assertEquals(6, t1.lineNum)
    assertEquals(10, t2.lineNum)
    assertEquals(true, tokens.every(t => t.type === parser.tokenType.ifStatement)) 
}, 'parsing if else test')

test(() => {
    let s = `
    while(x < 10) x++;

    do 
    {
        p = getP(p, 5);
    } while (p > 0)
    
    while (true) 
    {
        if (t++ > 0) return;
    }`

    let tokens = parser.parseDoWhile(s)
    assertEquals(4, tokens.length)

    let [t0, t1, t2, t3] = tokens
    assertEquals(2, t0.lineNum)
    assertEquals(4, t1.lineNum)
    assertEquals(7, t2.lineNum)
    assertEquals(9, t3.lineNum)
    assertEquals(true, tokens.every(t => t.type === parser.tokenType.whileStatement))
}, 'parsing do while test')

test(() => {
    let s = `public static int Id { get; set; }
    private Dictionary<string, double> Dict => _dict;
    int Count { internal get; private set; } = 10
    public int Number 
    {
        get
        {
            return 42;
        }
    }`

    let tokens = parser.parseProperty(s)
    assertEquals(true, tokens.every(t => t.type === parser.tokenType.property))
    assertArrEquals([1, 2, 3, 4], tokens.map(t => t.lineNum))
}, 'parsing property test')

test(() => {
    let s = `public static readonly List<string[]> S = "x";
    const int _y = 10;
    static string str;
    private const int p = 8;
    int t = 10;
    int T() {return 10;}
    int U => 10;`

    let tokens = parser.parseFieldOrLocal(s)
    assertEquals(true, tokens.every(t => t.type === parser.tokenType.fieldOrLocal))
    assertArrEquals([1, 2, 3, 4, 5], tokens.map(t => t.lineNum))
}, 'parseFieldOrLocal test')

test(() => {
    let s = `static string str;
    private const int = 8;
    int t = 10;
    int T() {return 10;}
    private static List<double> _X(int x, int y)
    {
        return new List<double> { 0.0 };
    }
    int U => 10;
    int V(bool b) => 10;`

    let tokens = parser.parseMethod(s)
    assertEquals(true, tokens.every(t => t.type === parser.tokenType.method))
    assertArrEquals([4, 5, 10], tokens.map(t => t.lineNum))
}, 'parseMethod test')

test(() => {
    let s = `a==b;
    a = 3
    a >= 4
    a += 5
    a != 'u'
    a => a * 2`

    let tokens = parser.parseAssignment(s)
    assertArrEquals([2, 4], tokens.map(t => t.lineNum))
}, 'parse assignments test')

test(() => {
    let re = new RegExp(parser.identifierName())
    assertEquals(false, re.test('new'))
    assertEquals(true, re.test('_x0'))
    assertEquals(false, re.test('0xy'))
}, 'identifier regex test')

test(() => {
    let re = new RegExp(parser.typeName())
    assertEquals(false, re.test('new'))
    assertEquals(true, re.test('int'))
    assertEquals(true, re.test('_x0'))
    assertEquals(true, re.test('Dictionary<string, int[]>'))
}, 'type name regex test')
