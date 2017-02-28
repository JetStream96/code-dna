const fs = require('fs');
const path = require('path');

const summary = [0, 0];
let fileName = '';
exports.test = function(action, name) {
    try {
        action();
        summary[0]++;
    } catch (err) {
        summary[1]++;
        console.log(`Test [${name}] failed: ` + err.message + `\n(${fileName})\n`);
    }
}

exports.assertEquals = function(expected, actual) {
    if (expected !== actual) {
        throw new Error(`Assertion error: expected ${expected}, but is ${actual}.`);
    }
};

function runAll(directory) {
    let paths = fs.readdirSync(directory)
        .filter(p => p !== __filename)
        .map(p => path.join(directory, p));

    paths.forEach(p => {
        let stat = fs.statSync(p);
        if (stat.isDirectory()) {
            runAll(p);
        } else if (stat.isFile()) {
            fileName = p;
            require(p);
        }
    });
}

runAll(__dirname);
console.log(`\n${summary[0]} test(s) passed, ${summary[1]} test(s) failed.`);