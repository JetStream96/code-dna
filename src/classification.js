const parser = require('./parser')
const util = require('./util')

function classifiedTokens(text) {
    let tokens = parser.parse(text)
    let groups = util.groupBy(tokens, t => t.type)

    let stats = new Map()
    groups.keys().forEach(key => {
        let val = groups[key]
        let occurence = val.length
        let sd = util.stdDeviation(val.map(t => t.lineNum))
        stats[key] = [occurence, sd]
    })

    return stats
}
