const parser = require('./parser')
const util = require('./util')
const grouping = require('./grouping')

function classifiedTokens(text) {
    let tokens = parser.parse(text)
    let groups = groupByPolicy(tokens)
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
