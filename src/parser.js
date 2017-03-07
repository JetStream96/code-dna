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

/**
 * Parse the source file and returns all recognized tokens.
 * @param {string} text
 * @returns {Token[]}
 */
function parse(source) {
    let text = source.replace('\r\n', '\n')
    let [text1, comments] = parseComments(text)
    let [t, strings] = parseStringLiterals(text1)

    let property = parseProperty(t)
    let field = parseFields(t)
    let ifElse = parseIfElse(t)
    let doWhile = parseDoWhile(t)
    let switchCase = parseSwitchCase(t)
    let forLoop = parseForLoop(t)
    let func = parseFunc(t)
    let classOrStruct = parseClassOrStruct(t)
    let interface = parseInterface(t)
    let tryCatchFinally = parseTryCatchFinally(t)
    let using = parseUsing(t)
    let assignment = parseAssignment(t)
    let instantiation = parseNew(t)
    let returnStatement = parseReturn(t)

    let empty = parseEmptyLines(t)

    return [].concat(comments, strings, property, field, ifElse, doWhile, switchCase, forLoop, 
        func, classOrStruct, interface, tryCatchFinally, using, assignment, instantiation, 
        returnStatement, empty)
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
    property: 0,
    field: 1,
    ifStatement: 2,
    whileStatement: 3,
    switchCase: 4,
    forLoop: 5,
    function: 6,
    classOrStruct: 7,
    interface: 8,
    emptyLine: 9,
    comment: 10,
    stringLiteral: 11,
    tryCatchFinally: 12,
    using: 13,
    assignment: 14,
    instantiation: 15,
    return: 16
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

function parseTryCatchFinally(text) {
    return createToken(text, /\b(try|catch|finally)\b/g, TokenType.tryCatchFinally)
}

function parseUsing(text) {
    return createToken(text, /\busing\b/g, TokenType.using)
}

function parseAssignment(text) {
    return createToken(text, /[\b\s][+\-*/]?=[\b\s]/g, TokenType.assignment)
}

function parseNew(text) {
    return createToken(text, /\bnew\b/g, TokenType.instantiation)
}

function parseProperty(text) {
    let mti = modifierTypeIdentifier()
    let am = accessModifiers()
    let re = new RegExp(`${mti}\\s*?(=>|{\\s*?${am}?\\s*?[gs]et\\s*?[;{])`, 'g')
    return createToken(text, re, TokenType.property)
}

function parseFields(text) {
    let mod = modifiers()
    let id = identifierName()
    let re = new RegExp(`${modifierTypeIdentifier()}\\s*?(=(?!>)|;)`, 'g')
    return createToken(text, re, TokenType.field)
}

function identifierName() {
    return /\b[_A-Za-z]\w*?\b/.source
}

function typeName() {
    // Need to match generics and array.
    return /\b[_A-Za-z][<, >\[\]\w]*?(?!<, >\[\]\w)/.source
}

function modifiers() {
    return /\b(public|private|internal|protected|readonly|const|static|abstract|override)\b/.source
}

function accessModifiers() {
    return '(public|private|internal|protected)'
}

function modifierTypeIdentifier() {
    let mod = modifiers()
    let t = typeName()
    let id = identifierName()
    return `(${mod}\\s+?)*?${t}\\s+${id}`
}

function parseFunc(text) {
    let re = new RegExp(`${modifierTypeIdentifier()}\\s*?\\([^\\)]*?\\)`, 'g')
    return createToken(text, re, TokenType.function)
}

function parseReturn(text) {
    return createToken(text, /\breturn\b/g, TokenType.return)
}

// Match the lines that are effectively empty.
function parseEmptyLines(text) {
    return createToken(text, /^\W.*$/gm, TokenType.emptyLine)
}

exports.TokenType = TokenType
exports.parse = parse
exports.parseComments = parseComments
exports.lineNum = lineNum
exports.reMatches = reMatches
exports.parseStringLiterals = parseStringLiterals
exports.parseIfElse = parseIfElse
exports.parseDoWhile = parseDoWhile
exports.parseProperty = parseProperty
exports.parseFields = parseFields
exports.parseFunc = parseFunc
exports.parseAssignment = parseAssignment
