/**
 * Module exporting functions to support debugging.
 */
 
const INDENT_WD = 2;

function padlen(indent: number): string {
    return ''.padStart(indent, ' ');
}

function dumpArrayMultiLine(val: unknown[], indent: number): string {
    const len = val.length;

    let ret = `Array(len=${val.length})[`;

    if (len) {
        const padstr = padlen(indent + INDENT_WD);

        ret += '\n'
            + val.map((v, i) => `${padstr}${i}: ${dumpMultiLine(v, indent + INDENT_WD)}\n`).join('')
            + padlen(indent);
    }
    
    return ret + ']';
}

function dumpArrayOneLine(val: unknown[]): string {
    return '[' + val.map(dumpOneLine).join(',') + ']';
}

function dumpObjectMultiLine(val: Record<string, unknown>, indent: number): string {
    const keys = Object.keys(val);

    if (keys.length) {
        const padstr = padlen(indent + INDENT_WD);

        return '{\n'
            + keys.map(k => `${padstr}${JSON.stringify(k)}: ${dumpMultiLine(val[k], indent + INDENT_WD)}\n`).join('')
            + padlen(indent)
            + '}';
    }

    return '{}';
}

function dumpObjectOneLine(val: Record<string, unknown>): string {
    return '{' + Object.keys(val).map(k => `${JSON.stringify(k)}:${dumpOneLine(val[k])}`).join(',') + '}';
}

export function dumpMultiLine(val: unknown, indent = 0) {
    switch (typeof val) {
    case 'string':
        return JSON.stringify(val);
    case 'boolean':
        return val ? 'true' : 'false';
    case 'undefined':
        return 'undefined';
    case 'object':
        if (val === null) {
            return 'null';
        }

        if (Array.isArray(val)) {
            return dumpArrayMultiLine(val, indent);
        }

        if ('describe' in val && typeof val.describe === 'function') {
            return val.describe(indent);
        }

        return dumpObjectMultiLine(val as Record<string, unknown>, indent);
    case 'number':
    case 'bigint':
    case 'symbol':
    case 'function':
        return val.toString();
    }
}

export function dumpOneLine(val: unknown) {
    switch (typeof val) {
    case 'string':
        return JSON.stringify(val);
    case 'boolean':
        return val ? 'true' : 'false';
    case 'undefined':
        return 'undefined';
    case 'object':
        if (val === null) {
            return 'null';
        }

        if (Array.isArray(val)) {
            return dumpArrayOneLine(val);
        }

        if ('describe' in val && typeof val.describe === 'function') {
            return val.describe();
        }

        return dumpObjectOneLine(val as Record<string, unknown>);
    case 'number':
    case 'bigint':
    case 'symbol':
    case 'function':
        return val.toString();
    }
}

export function dumpHex(...n: number[]) {
    return '0x' + n.map(v => (v < 16 ? '0' : '') + v.toString(16)).join('');
}