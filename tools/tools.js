/**
 * Tools for manual testing and debugging of the parser.
 */

const fs = require('fs')
const path = require('path')
const parser = require('../src/parser')
const util = require('../src/util')

// Path of the test source file.
const source = path.join(__dirname, 'src-file')

// Path of the result file.
const result = path.join(__dirname, 'result.txt')

function getFileSummary() {
    let tokens = parser.parse(fs.readFileSync(source, 'utf8'))
    let b = util.putIntoBuckets(tokens, t => t.lineNum)

    // Trim buckets so that array index corresponds to lineNum.
    // ?? 0
    let buckets = new Array(b[0].lineNum).concat(b)
    let lines = Array(buckets.length).fill('')
    buckets.forEach((b, ind) => {
        if (b !== undefined) {
            b.forEach(t => lines[ind] += ' ' + parser.TokenTypeName(t.type))
        }        
    })

    fs.writeFileSync(result, lines.slice(1).join('\n'))
}

getFileSummary()
