const parser = require('./parser')
const util = require('./util')
const range = util.range

let displayTypes = {
    propertyMethod: 0,
    fieldOrLocal: 1,
    ifSwitchCase: 2,
    whileForLoop: 3,
    classStructInterface: 4,
    emptyLine: 5,
    comment: 6,
    stringLiteral: 7,
    tryCatchFinally: 8,
    using: 9,
    assignment: 10,
    instantiation: 11,
    return: 12,
    other: 13
}

// For example, this maps '9' to 5 means that 9th element of parser.TokenType is grouped as 
// 5th element of displayTypes.
let fromTokenTypes = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 2,
    '5': 3,
    '6': 0,
    '7': 4,
    '8': 4,
    '9': 5,
    '10': 6,
    '11': 7,
    '12': 8,
    '13': 9,
    '14': 10,
    '15': 11,
    '16': 12,
}

let displayNames = [ 'property/method', 'field/local variable', 'if/switch case', 'while/for loop',
    'class/struct/interface', 'empty line', 'comment', 'string literal', 'try/catch/finally', 
    'using', 'assignment', 'instantiation', 'return', 'other']

exports.displayTypes = displayTypes
exports.displayNames = displayNames
exports.fromTokenTypes = fromTokenTypes
