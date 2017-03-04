const fs = require('fs')
const path = require('path')
const util = require('./util')

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
    let sourceFile = new SourceFile(filePath, text)

}

/**
 * Parse and replace all comments with spaces of the same length.
 * The new line chars are preserved.
 * @param {string} text
 * @returns {[string, CommentToken[]]}
 */
function parseComments(text) {
    return parseCommentsOrStringLiterals(text, /(\/\/.*?(\n|$)|\/\*[\s\S]*?((\*\/)|$))/g, true)
}

/**
 * @param {string} text 
 * @param {RegExp} re 
 * @param {boolean} isComments 
 */
function parseCommentsOrStringLiterals(text, re, isComments) {
    let matches = reMatches(text, re)
    let indexLengthPairs = []
    let tokens = []

    for (let m of [...matches].slice(1)) {
        let s = m[0]
        let index = m['index']
        let num = lineNum(text, index)
        let lineSpan = util.charCount(s, '\n') + 1
        let pair = [index, s.length]

        if (isComments) {
            indexLengthPairs.push(pair)
            tokens.push(new CommentToken(num, lineSpan, s.length))
        } else {
            indexLengthPairs.push(getIndexLength(s, pair))
            tokens.push(new StringLiteralToken(num, lineSpan, s.length))
        }
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

function* reMatches(input, re) {
    yield undefined
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
    tryBlock: 14
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

    for (let m of [...matches].slice(1)) {
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

exports.TokenType = TokenType
exports.parseComments = parseComments
exports.lineNum = lineNum
exports.reMatches = reMatches
exports.parseStringLiterals = parseStringLiterals