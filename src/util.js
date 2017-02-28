function strReplace(str, indexLengthPairs) {
    let arr = [...str];
    indexLengthPairs.forEach(p => {
        [index, len] = p;
        [...range(index, len)].forEach(i => arr[i] = ' ');
    });
    return arr.join('');
}

function* range(start, count) {
    if (count < 0) {
        throw new Error('count cannot be negative.');
    }

    for (let n = start; n < start + count; n++) {
        yield n;
    }
}

function charCount(str, char) {
    let c = 0;
    for (let i of str) {
        if (i === char) {
            c++;
        }
    }
    return c;
}

exports.strReplace = strReplace;
exports.range = range;
exports.charCount = charCount;