/**
 * Reads the files in source code directory and transform into a tree, which is then used to
 * draw the final image.
 */
const fs = require('fs')
const classification = require('../classification')
const util = require('../util')

const range = util.range
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
        } else if (stat.isFile() && filterFile(p)) {
            return readFile(p)
        }
    })

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

/**
 * Recursively merge nodes of all children which satisfies the criteria of mergeChildren,
 * until the total node count is no larger than maxNodeCount.
 */
function collapseTree(rootNode, maxNodeCount) {
    if (maxNodeCount < 1) {
        throw new Error()
    }
    
    let nodeCount = childrenCount(rootNode) + 1
    let targetNodes = addMergeTarget(new Set(), rootNode)
    
    while (nodeCount > maxNodeCount) {
        // Well, the nodes need to know their parent ...
    }
}

/**
 * If the node itself or any child can be merged, it will be added to the set.
 * @param {Set} set 
 * @param {Node} node 
 */
function addMergeTarget(set, node) {
    if (canMergeChildren(node)) {
        set.add(node)
    } else {
        node.children.forEach(c => addMergeTarget(set, c))
    }
}

function canMergeChildren(node) {
    let children = node.children
    return children.length > 0 && children.every(c => c.children.length === 0)
}

/**
 * @param {Node} node A node where all its children are leaves.
 * @returns {Node} New node
 */
function mergeChildren(node) {
    if (!canMergeChildren(node)) {
        throw new Error()
    }

    let children = node.children
    let totalLineCount = util.sum(children, c => c.lineCount)

    // Merge token array.
    let len = children[0].tokens.length
    let newTokens = []
    range(len).forEach(i => newTokens[i] = [0, 0])

    children.forEach(c => {
        range(len).forEach(i => {
            let [occ, sd] = c.tokens[i]
            let [occSum, sdSum] = newTokens[i]
            newTokens[i] = [occ + occSum, sd * c.lineCount + sdSum]
        })
    })

    // Weighted average of sd.
    range(len).forEach(i => newTokens[i][1] /= totalLineCount)
    return new Node(newTokens, node.isFile, emptyArr, node.fullPath, totalLineCount)
}

/**
 * Returns the number of child nodes.
 * @param {Node} node 
 */
function childrenCount(node) {
    if (node.children.length === 0) {
        // File or empty directory.
        return 0
    }
    return util.sum(node.children, child => 1 + childrenCount(child))
}
