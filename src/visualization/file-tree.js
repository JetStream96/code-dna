/**
 * Reads the files in source code directory and transform into a tree, which is then used to
 * draw the final image.
 */
const fs = require('fs')
const classification = require('../classification')
const util = require('../util')

const emptyArr = []

class Node {
    /**
     * Create a node without child. Usually this is for a source file, but a bottom-level node
     * is possible for a directory.
     * @param {[]} tokens An array where each index contains token info of that type.
     * The token info is an array containing occurence and standard deviation.
     * @param {boolean} isFile True for file. False for directory.
     * @param {Node[]} children The child nodes. Empty array if not avail.
     * @param {string} fullPath The file/directory path.
     * @param {number} lineCount Total line count of the file or all files combined in the directory.
     */
    constructor(tokens, isFile, children, fullPath, lineCount) {
        this.tokens = tokens
        this.isFile = isFile
        this.children = children
        this.fullPath = fullPath
        this.lineCount = lineCount
    }

    /**
     * For directory, tokens is empty and lineCount is set to -1.
     */
    static createDir(children, fullPath) {
        return new Node(emptyArr, false, children, fullPath, -1)
    }
}

function filterFile(filePath) {
    return /\.cs$/.test(filePath)
}

/**
 * Returns the parsed node.
 * @param {string} path Full path of file or directory.
 */
function readDir(dir) {
    let paths = fs.readdirSync(dir).map(p => path.join(dir, p))
    let children = paths.map(p => {
        let stat = fs.statSync(p)
        if (stat.isDirectory()) {
            return Node.createDir(readDir(p), p)
        } else if (stat.isFile()) {
            return readFile(p)
        }
    });

    return Node.createDir(children, dir)
}

/**
 * Parse the file and returns the node.
 * @param {string} file Full file path.
 */
function readFile(file) {
    let text = fs.readFileSync(file, 'utf8');
    let lineCount = util.lineCount(file)
    let tokenInfo = classification.classifiedTokens(text)
    return new Node(tokenInfo, true, [], file, lineCount)
}

function collapseTree(rootNode) {
    
}
