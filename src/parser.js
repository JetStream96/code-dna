const fs = require('fs');
const path = require('path');
const util = require('./util');

class Token {

    /**
     * @param {number} lineNum
     * @param {TokenType} type
     */
    constructor(lineNum, type) {
        this.lineNum = lineNum;
        this.type = type;
    }
}

class StringLiteralToken extends Token {
    constructor(lineNum, lineSpan, length) {
        super(lineNum, TokenType.stringLiteral);
        this.lineSpan = lineSpan;
        this.length = length;
    }
}

// filePath: string
// returns: [Token]
function parse(filePath) {
    let text = fs.readFileSync(filePath).replace('\r\n', '\n');
    let sourceFile = new SourceFile(filePath, text);

}

/**
 * Parse and replace all comments with spaces of the same length.
 * The new line chars are preserved.
 * @param {string} text
 * @returns {[string, StringLiteralToken[]]}
 */
function parseComments(text) {
    let matches = reMatches(text, /(\/\/.*?\n|\/\*[\s\S]*?\*\/)/g);
    let indexLengthPairs = [];
    let tokens = [];

    for (let m of matches) {
        let s = m[0];
        let index = m['index'];
        let num = lineNum(text, index);

        indexLengthPairs.push([index, s.length]);        
        tokens.push(new StringLiteralToken(num, util.charCount(s, '\n') + 1, s.length));
    }
    
    return [util.strReplace(text, indexLengthPairs), tokens];
}

/**
 * @param {string} fullText
 * @param {number} index
 */
function lineNum(fullText, index) {
    return util.charCount(fullText.slice(0, index), '\n') + 1;
}

function* reMatches(input, re) {
    yield undefined;
    while (true) {
        let match = re.exec(input);
        if (match) {
            yield match;
        } else {
            break;
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
};

exports.TokenType = TokenType;
exports.lineNum = lineNum;
exports.reMatches = reMatches;