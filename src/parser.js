const fs = require('fs')
const path = require('path')
const util = require('./util')

const range = util.range

class Token {

    /**
     * @param {number} lineNum
     * @param {TokenType} type
     */
    constructor(lineNum, type) {
        this.lineNum = lineNum
        this.type = type
    }
}

class CommentToken extends Token {
    constructor(lineNum, lineSpan, length) {
        super(lineNum, TokenType.comment)
        this.lineSpan = lineSpan
        this.length = length
    }
}

class StringLiteralToken extends Token {
    constructor(lineNum, lineSpan, length) {
        super(lineNum, TokenType.stringLiteral)
        this.lineSpan = lineSpan
        this.length = length
    }
}

// filePath: string
// returns: [Token]
function parse(filePath) {
    let text = fs.readFileSync(filePath).replace('\r\n', '\n')
    let [text1, comments] = parseComments(text)
    let [t, strings] = parseStringLiterals(text1)

    let ifElse = parseIfElse(t)
    let doWhile = parseDoWhile(t)
    let switchCase = parseSwitchCase(t)
    let forLoop = parseForLoop(t)
    let classOrStruct = parseClassOrStruct(t)
    let interface = parseInterface(t)
    let tryCatchFinally = parsetryCatchFinally(t)
    let using = parseUsing(t)
    
}

/**
 * Parse and replace all comments with spaces of the same length.
 * The new line chars are preserved.
 * @param {string} text
 * @returns {[string, CommentToken[]]}
 */
function parseComments(text) {
    let matches = reMatches(text, /(\/\/.*?(\n|$)|\/\*[\s\S]*?((\*\/)|$))/g)
    let indexLengthPairs = []
    let tokens = []

    for (let m of matches) {
        let s = m[0]
        let index = m['index']
        let num = lineNum(text, index)
        let lineSpan = util.charCount(s, '\n') + 1

        indexLengthPairs.push([index, s.length])
        tokens.push(new CommentToken(num, lineSpan, s.length))        
    }
    
    return [util.strReplace(text, indexLengthPairs), tokens]
}

/**
 * @param {string} fullText
 * @param {number} index
 */
function lineNum(fullText, index) {
    return util.charCount(fullText.slice(0, index), '\n') + 1
}

function reMatches(input, re) {
    return [...reMatchesIter(input, re)]
}

function* reMatchesIter(input, re) {
    while (true) {
        let match = re.exec(input)
        if (match) {
            yield match
        } else {
            break
        }
    }
}

let TokenType = {
    propertyGetter: 0,
    propertySetter: 1,
    field: 2,
    ifStatement: 3,
    whileStatement: 4,
    switchCase: 5,
    forLoop: 6,
    functions: 7,
    classOrStruct: 8,
    interface: 9,
    emptyLine: 10,
    comment: 11,
    lambda: 12,
    stringLiteral: 13,
    tryCatchFinally: 14,
    using: 15
}

/**
 * Parse and replace all string literals with spaces of the same length.
 * The new line chars are preserved.
 * @param {string} text
 * @returns {[string, StringLiteralToken[]]}
 */
function parseStringLiterals(text) {
    let re = /(\$?"([^\n]*?[^\\])?")|(@"([^s^S]*[^"])?")([^"]|$)/g
    //         ^^ ^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^
    //         1          2                       3
    // 1: string interpolation
    // 2: basic string
    // 3: verbatim string

    let matches = reMatches(text, re)
    let indexLengthPairs = []
    let tokens = []

    for (let m of matches) {
        let s = m[1] ? m[1] : m[3]
        let index = m['index']
        let num = lineNum(text, index)
        let lineSpan = util.charCount(s, '\n') + 1

        indexLengthPairs.push(getIndexLength(s, [index, s.length]))
        tokens.push(new StringLiteralToken(num, lineSpan, s.length))        
    }
    
    return [util.strReplace(text, indexLengthPairs), tokens]
}

function getIndexLength(match, indexLengthPair) {
    let [ind, len] = indexLengthPair
    if (match[0] === '"') {
        return [ind + 1, len - 2]
    }

    // Is @" or $" style comments
    return [ind + 2, len - 3]
}

function createToken(text, re, type) {
    let m = reMatches(text, re)
    return m.map(i => new Token(lineNum(text, i['index']), type)) 
}

/**
 * @param {string} text 
 * @returns {Token[]}
 */
function parseIfElse(text) {
    return createToken(text, /\b((else\s+)?if)|(else)\b/g, TokenType.ifStatement)
}

function parseDoWhile(text) {
    return createToken(text, /\b(do|while)\b/g, TokenType.whileStatement)
}

function parseSwitchCase(text) {
    return createToken(text, /\b(switch|case)\b/g, TokenType.switchCase)
}

function parseForLoop(text) {
    return createToken(text, /\bfor(each)?\b/g, TokenType.forLoop)
}

function parseClassOrStruct(text) {
    return createToken(text, /\b(class|struct)\b/g, TokenType.classOrStruct)
}

function parseInterface(text) {
    return createToken(text, /\binterface\b/g, TokenType.interface)
}

function parsetryCatchFinally(text) {
    return createToken(text, /\b(try|catch|finally)\b/g, TokenType.tryCatchFinally)
}

function parseUsing(text) {
    return createToken(text, /\busing\b/g, TokenType.using)
}

function parsePropertyGetter(text) {
    let targetScopes = matchClassStructInterface(text)

    ///{[\s\S]*?(get)\b/g
}

function parsePropertySetter(text) {

}

/**
 * Returns the matches, which contains the texts between (including) the two curly brackets. 
 */
function matchClassStructInterface(text) {
    let m = reMatches(text, /\b(class|struct|interface)\b/g)
    return m.map(i => {
        let index = i['index']
        let leftBraket = text.indexOf('{', index)
        if (leftBraket < 0) return undefined

        let rightBraket = getRightCurlyBracketIndex(text, leftBraket + 1)
        if (rightBraket === -1) return undefined
        return [leftBraket, rightBraket]
    }).filter(m => m !== undefined)
}

// Returns -1 if not found.
function getRightCurlyBracketIndex(text, start=0) {
    let extraCount = 0
    for (let i of range(start, text.length - start)) {
        let c = text[i]
        if (extraCount === 0 && c === '}') {
            return i
        }

        if (c === '{') {
            extraCount++
        } else if (c === '}') {
            extraCount--
        }
    }
    return -1
}

function parseFields(text) {

}

exports.TokenType = TokenType
exports.parseComments = parseComments
exports.lineNum = lineNum
exports.reMatches = reMatches
exports.parseStringLiterals = parseStringLiterals
exports.parseIfElse = parseIfElse
exports.parseDoWhile = parseDoWhile
exports.parsePropertyGetter = parsePropertyGetter
exports.parsePropertySetter = parsePropertySetter
exports.matchClassStructInterface = matchClassStructInterface
exports.parseFields = parseFields
