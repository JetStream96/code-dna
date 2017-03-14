const fs = require('fs')
const path = require('path')
const util = require('./util')

const range = util.range

let tokenType = {
    property: 0,
    fieldOrLocal: 1,
    ifStatement: 2,
    whileStatement: 3,
    switchCase: 4,
    forLoop: 5,
    method: 6,
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

let tokenTypeStr = ['property', 'fieldOrLocal', 'ifStatement', 'whileStatement', 'switchCase',
    'forLoop', 'method', 'classOrStruct', 'interface', 'emptyLine', 'comment', 'stringLiteral',
    'tryCatchFinally', 'using', 'assignment', 'instantiation', 'return'] 

let keywords = [
    'abstract', 'as', 'base', 'bool',
    'break', 'byte', 'case', 'catch',
    'char', 'checked', 'class', 'const',
    'continue', 'decimal', 'default', 'delegate',
    'do', 'double', 'else', 'enum',
    'event', 'explicit', 'extern', 'false',
    'finally', 'fixed', 'float', 'for',
    'foreach', 'goto', 'if', 'implicit',
    'in', 'int', 'interface',
    'internal', 'is', 'lock', 'long',
    'namespace', 'new', 'null', 'object',
    'operator', 'out', 'override',
    'params', 'private', 'protected', 'public',
    'readonly', 'ref', 'return', 'sbyte',
    'sealed', 'short', 'sizeof', 'stackalloc',
    'static', 'string', 'struct', 'switch',
    'this', 'throw', 'true', 'try',
    'typeof', 'uint', 'ulong', 'unchecked',
    'unsafe', 'ushort', 'using', 'virtual',
    'void', 'volatile', 'while']

let keywordsNonTypeName = [
    'abstract', 'as', 'base', 
    'break', 'case', 'catch',
    'checked', 'class', 'const',
    'continue', 'default', 'delegate',
    'do', 'else',
    'event', 'explicit', 'extern', 'false',
    'finally', 'fixed', 'for',
    'foreach', 'goto', 'if', 'implicit',
    'in', 'interface',
    'internal', 'is', 'lock',
    'namespace', 'new', 'null',
    'operator', 'out', 'override',
    'params', 'private', 'protected', 'public',
    'readonly', 'ref', 'return',
    'sealed', 'sizeof', 'stackalloc',
    'static', 'struct', 'switch',
    'this', 'throw', 'true', 'try',
    'typeof', 'unchecked',
    'unsafe', 'using', 'virtual',
    'volatile', 'while']

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
        super(lineNum, tokenType.comment)
        this.lineSpan = lineSpan
        this.length = length
    }
}

class StringLiteralToken extends Token {
    constructor(lineNum, lineSpan, length) {
        super(lineNum, tokenType.stringLiteral)
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
    let text = source.replace(/\r\n/g, '\n')
    let [text1, comments] = parseComments(text)
    let [t, strings] = parseStringLiterals(text1)

    let property = parseProperty(t)
    let field = parseFieldOrLocal(t)
    let ifElse = parseIfElse(t)
    let doWhile = parseDoWhile(t)
    let switchCase = parseSwitchCase(t)
    let forLoop = parseForLoop(t)
    let method = parseMethod(t)
    let classOrStruct = parseClassOrStruct(t)
    let interface = parseInterface(t)
    let tryCatchFinally = parseTryCatchFinally(t)
    let using = parseUsing(t)
    let assignment = parseAssignment(t)
    let instantiation = parseNew(t)
    let returnStatement = parseReturn(t)

    let empty = filterEmptyLines(parseEmptyLines(t), strings, comments)

    return [].concat(comments, strings, property, field, ifElse, doWhile, switchCase, forLoop, 
        method, classOrStruct, interface, tryCatchFinally, using, assignment, instantiation, 
        returnStatement, empty)
}

/**
 * Because comments and strings are replaced with spaces when parsing, lines that contains only
 * comments or strings may be incorrectly flagged as empty lines.
 */
function filterEmptyLines(emptyLineTokens, stringTokens, commentTokens) {
    let s = new Set(commentTokens.concat(stringTokens).map(t => t.lineNum))
    return emptyLineTokens.filter(t => !s.has(t.lineNum))
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

function tokenTypeName(type) {
    return tokenTypeStr[type]
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
    return createToken(text, /\b((else\s+)?if)|(else)\b/g, tokenType.ifStatement)
}

function parseDoWhile(text) {
    return createToken(text, /\b(do|while)\b/g, tokenType.whileStatement)
}

function parseSwitchCase(text) {
    return createToken(text, /\b(switch|case)\b/g, tokenType.switchCase)
}

function parseForLoop(text) {
    return createToken(text, /\bfor(each)?\b/g, tokenType.forLoop)
}

function parseClassOrStruct(text) {
    return createToken(text, /\b(class|struct)\b/g, tokenType.classOrStruct)
}

function parseInterface(text) {
    return createToken(text, /\binterface\b/g, tokenType.interface)
}

function parseTryCatchFinally(text) {
    return createToken(text, /\b(try|catch|finally)\b/g, tokenType.tryCatchFinally)
}

function parseUsing(text) {
    return createToken(text, /\busing\b/g, tokenType.using)
}

function parseAssignment(text) {
    return createToken(text, /[\b\s][+\-*/]?=[\b\s]/g, tokenType.assignment)
}

function parseNew(text) {
    return createToken(text, /\bnew\b/g, tokenType.instantiation)
}

function parseProperty(text) {
    let mti = modifierTypeIdentifier()
    let am = accessModifiers()
    let re = new RegExp(`${mti}\\s*?(=>|{\\s*?${am}?\\s*?[gs]et\\s*?[;{])`, 'g')
    return createToken(text, re, tokenType.property)
}

function parseFieldOrLocal(text) {
    let re = new RegExp(`${modifierTypeIdentifier()}\\s*?(=(?!>)|;)`, 'g')
    return createToken(text, re, tokenType.fieldOrLocal)
}

function identifierName() {
    let namePattern = /[_A-Za-z]\w*?\b/.source
    return `\\b${rejectKeywords()}${namePattern}`
}

function typeName() {
    // Need to match generics and array and cannot match language keywords.
    let namePattern = /[_A-Za-z][<, >\[\]\w]*?(?!<, >\[\]\w)/.source
    return `\\b${rejectNonTypeNameKeywords()}${namePattern}`
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

function parseMethod(text) {
    let re = new RegExp(`${modifierTypeIdentifier()}\\s*?\\([^\\)]*?\\)`, 'g')
    return createToken(text, re, tokenType.method)
}

function parseReturn(text) {
    return createToken(text, /\breturn\b/g, tokenType.return)
}

// Match the lines that are effectively empty.
function parseEmptyLines(text) {
    return createToken(text, /^[^\w\n]*?\n/gm, tokenType.emptyLine)
}

function negativeLookaheadGroup(words) {
    let w = words.map(k => k + '\\b' )
    return '(?!' + w[0] + w.slice(1).map(k => '|' + k).join('') + ')' 
}

// Returns a regex like (?!int\b|float\b|double\b)
function rejectKeywords() {
    return negativeLookaheadGroup(keywords)
}

function rejectNonTypeNameKeywords() {
    return negativeLookaheadGroup(keywordsNonTypeName)
}

exports.tokenType = tokenType
exports.parse = parse
exports.parseComments = parseComments
exports.lineNum = lineNum
exports.reMatches = reMatches
exports.parseStringLiterals = parseStringLiterals
exports.parseIfElse = parseIfElse
exports.parseDoWhile = parseDoWhile
exports.parseProperty = parseProperty
exports.parseFieldOrLocal = parseFieldOrLocal
exports.parseMethod = parseMethod
exports.parseAssignment = parseAssignment
exports.tokenTypeName = tokenTypeName
exports.identifierName = identifierName
exports.typeName = typeName
exports.Token = Token
