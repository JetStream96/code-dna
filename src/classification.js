const parser = require('./parser')
const util = require('./util')
const grouping = require('./grouping')

const range = util.range

/**
 * Parse the source code and group the tokens according to policy specified in grouping.js.
 * @param {string} text 
 */
function classifiedTokens(text) {
    let tokens = parser.parse(text)
    let lineCount = util.lineCount(text)
    let other = getOtherToken(lineCount, tokens)
    let groups = groupByPolicy(tokens.concat(other))
    let stats = groups.map(tokensInType => {
        let occurence = tokensInType.length
        let sd = util.stdDeviation(tokensInType.map(t => t.lineNum))
        return [occurence, sd]
    })

    return stats
}

function groupByPolicy(tokens) {
    let groups = []
    tokens.forEach(t => {
        let mappedType = grouping.fromTokenTypes[t.type]
        let g = groups[mappedType]
        if (g === undefined) {
            g = [t]
        } else {
            g.push(t)
        }
    })
    
    return groups
}

function getOtherToken(lineCount, tokens) {
    let m = new Map()
    tokens.forEach(t => m[t.lineNum] = 0)
    let res = []
    range(0, lineCount).forEach(i => {
        if (m[i] !== 0) {
            res.push(new parser.Token(i, grouping.displayTypes.other))
        }
    })
    return res
}

exports.classifiedTokens = classifiedTokens
exports.getOtherToken = getOtherToken
