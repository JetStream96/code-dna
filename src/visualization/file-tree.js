/**
 * Reads the files in source code directory and transform into a tree, which is then used to
 * draw the final image.
 */
const fs = require('fs')
const classification = require('../classification')
const util = require('../util')

const range = util.range
const emptyArr = []

/**
 * Should be used as an immutable object.
 */
class Node {
    /**
     * Create a node without child. Usually this is for a source file, but a bottom-level node
     * is possible for a directory.
     * @param {[]} tokens An array where each index contains token info of that type.
     * The token info is an array containing occurence and standard deviation.
     * @param {boolean} isFile True for file. False for directory.
     * @param {Node} parent Undefined if it has no parent.
     * @param {Set} children The child nodes. Empty set if there is none.
     * @param {string} fullPath The file/directory path.
     * @param {number} lineCount Total line count of the file or all files combined in the directory.
     */
    constructor(tokens, isFile, parent, children, fullPath, lineCount) {
        this.tokens = tokens
        this.isFile = isFile
        this.parent = parent
        this.children = children
        this.fullPath = fullPath
        this.lineCount = lineCount
    }

    /**
     * For directory, tokens is empty and lineCount is set to -1.
     */
    static createDir(children, fullPath) {
        return new Node(emptyArr, false, undefined, children, fullPath, -1)
    }
}

function isTargetCodeFile(filePath) {
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
        } else if (stat.isFile() && isTargetCodeFile(p)) {
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
    return new Node(tokenInfo, true, undefined, [], file, lineCount)
}

/**
 * Recursively merge nodes of all children which satisfies the criteria of mergeChildren,
 * i.e. until the total node count is no larger than maxNodeCount.
 */
function collapseTree(rootNode, maxNodeCount) {
    if (maxNodeCount < 1) {
        throw new Error()
    }
    
    let nodeCount = descendantCount(rootNode) + 1
    let mergeTargets = new Set()
    let targetNodes = addMergeTarget(mergeTargets, rootNode)
        
    while (nodeCount > maxNodeCount) {
        
        // Get an element in the set.
        let target = util.any(mergeTargets)
        
        mergeTargets.delete(target)
        let newNode = mergeChildren(target)
        let parent = target.parent
        parent.children.delete(target)
        parent.children.add(newNode)

        //nodeCount -= target.
        // Well, the nodes need to know their parent ...
    }
}

/**
 * For the node itself and all its descendents, if a node can be merged, it will be added to the set.
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

/**
 * Returns true if the given node has at least a child and each of its child is a leaf.
 */
function canMergeChildren(node) {
    let children = node.children
    return children.length > 0 && children.every(c => c.children.length === 0)
}

/**
 * Given a node whose children are all leaves, merge them into the current node.
 * @param {Node} node A node where all its children are leaves.
 * @returns {Node} The new node
 */
function mergeChildren(node) {
    if (!canMergeChildren(node)) {
        throw new Error()
    }

    let children = node.children
    let totalLineCount = util.sum(children, c => c.lineCount)

    // Merge token array.
    let len = util.any(children).tokens.length
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
    return new Node(newTokens, node.isFile, node.parent, emptyArr, node.fullPath, totalLineCount)
}

/**
 * Returns the number of child nodes.
 * @param {Node} node 
 */
function descendantCount(node) {
    if (node.children.size === 0) {
        // File or empty directory.
        return 0
    }
    return util.sum(node.children, child => 1 + descendantCount(child))
}
