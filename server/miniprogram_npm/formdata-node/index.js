module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1753149255971, function(require, module, exports) {

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./FormData"), exports);
__exportStar(require("./Blob"), exports);
__exportStar(require("./File"), exports);

}, function(modId) {var map = {"./FormData":1753149255972,"./Blob":1753149255974,"./File":1753149255973}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255972, function(require, module, exports) {

var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FormData_instances, _FormData_entries, _FormData_setEntry;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormData = void 0;
const util_1 = require("util");
const File_1 = require("./File");
const isFile_1 = require("./isFile");
const isBlob_1 = require("./isBlob");
const isFunction_1 = require("./isFunction");
const deprecateConstructorEntries_1 = require("./deprecateConstructorEntries");
class FormData {
    constructor(entries) {
        _FormData_instances.add(this);
        _FormData_entries.set(this, new Map());
        if (entries) {
            (0, deprecateConstructorEntries_1.deprecateConstructorEntries)();
            entries.forEach(({ name, value, fileName }) => this.append(name, value, fileName));
        }
    }
    static [(_FormData_entries = new WeakMap(), _FormData_instances = new WeakSet(), Symbol.hasInstance)](value) {
        return Boolean(value
            && (0, isFunction_1.isFunction)(value.constructor)
            && value[Symbol.toStringTag] === "FormData"
            && (0, isFunction_1.isFunction)(value.append)
            && (0, isFunction_1.isFunction)(value.set)
            && (0, isFunction_1.isFunction)(value.get)
            && (0, isFunction_1.isFunction)(value.getAll)
            && (0, isFunction_1.isFunction)(value.has)
            && (0, isFunction_1.isFunction)(value.delete)
            && (0, isFunction_1.isFunction)(value.entries)
            && (0, isFunction_1.isFunction)(value.values)
            && (0, isFunction_1.isFunction)(value.keys)
            && (0, isFunction_1.isFunction)(value[Symbol.iterator])
            && (0, isFunction_1.isFunction)(value.forEach));
    }
    append(name, value, fileName) {
        __classPrivateFieldGet(this, _FormData_instances, "m", _FormData_setEntry).call(this, {
            name,
            fileName,
            append: true,
            rawValue: value,
            argsLength: arguments.length
        });
    }
    set(name, value, fileName) {
        __classPrivateFieldGet(this, _FormData_instances, "m", _FormData_setEntry).call(this, {
            name,
            fileName,
            append: false,
            rawValue: value,
            argsLength: arguments.length
        });
    }
    get(name) {
        const field = __classPrivateFieldGet(this, _FormData_entries, "f").get(String(name));
        if (!field) {
            return null;
        }
        return field[0];
    }
    getAll(name) {
        const field = __classPrivateFieldGet(this, _FormData_entries, "f").get(String(name));
        if (!field) {
            return [];
        }
        return field.slice();
    }
    has(name) {
        return __classPrivateFieldGet(this, _FormData_entries, "f").has(String(name));
    }
    delete(name) {
        __classPrivateFieldGet(this, _FormData_entries, "f").delete(String(name));
    }
    *keys() {
        for (const key of __classPrivateFieldGet(this, _FormData_entries, "f").keys()) {
            yield key;
        }
    }
    *entries() {
        for (const name of this.keys()) {
            const values = this.getAll(name);
            for (const value of values) {
                yield [name, value];
            }
        }
    }
    *values() {
        for (const [, value] of this) {
            yield value;
        }
    }
    [(_FormData_setEntry = function _FormData_setEntry({ name, rawValue, append, fileName, argsLength }) {
        const methodName = append ? "append" : "set";
        if (argsLength < 2) {
            throw new TypeError(`Failed to execute '${methodName}' on 'FormData': `
                + `2 arguments required, but only ${argsLength} present.`);
        }
        name = String(name);
        let value;
        if ((0, isFile_1.isFile)(rawValue)) {
            value = fileName === undefined
                ? rawValue
                : new File_1.File([rawValue], fileName, {
                    type: rawValue.type,
                    lastModified: rawValue.lastModified
                });
        }
        else if ((0, isBlob_1.isBlob)(rawValue)) {
            value = new File_1.File([rawValue], fileName === undefined ? "blob" : fileName, {
                type: rawValue.type
            });
        }
        else if (fileName) {
            throw new TypeError(`Failed to execute '${methodName}' on 'FormData': `
                + "parameter 2 is not of type 'Blob'.");
        }
        else {
            value = String(rawValue);
        }
        const values = __classPrivateFieldGet(this, _FormData_entries, "f").get(name);
        if (!values) {
            return void __classPrivateFieldGet(this, _FormData_entries, "f").set(name, [value]);
        }
        if (!append) {
            return void __classPrivateFieldGet(this, _FormData_entries, "f").set(name, [value]);
        }
        values.push(value);
    }, Symbol.iterator)]() {
        return this.entries();
    }
    forEach(callback, thisArg) {
        for (const [name, value] of this) {
            callback.call(thisArg, value, name, this);
        }
    }
    get [Symbol.toStringTag]() {
        return "FormData";
    }
    [util_1.inspect.custom]() {
        return this[Symbol.toStringTag];
    }
}
exports.FormData = FormData;

}, function(modId) { var map = {"./File":1753149255973,"./isFile":1753149255977,"./isBlob":1753149255978,"./isFunction":1753149255975,"./deprecateConstructorEntries":1753149255979}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255973, function(require, module, exports) {

var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _File_name, _File_lastModified;
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const Blob_1 = require("./Blob");
class File extends Blob_1.Blob {
    constructor(fileBits, name, options = {}) {
        super(fileBits, options);
        _File_name.set(this, void 0);
        _File_lastModified.set(this, 0);
        if (arguments.length < 2) {
            throw new TypeError("Failed to construct 'File': 2 arguments required, "
                + `but only ${arguments.length} present.`);
        }
        __classPrivateFieldSet(this, _File_name, String(name), "f");
        const lastModified = options.lastModified === undefined
            ? Date.now()
            : Number(options.lastModified);
        if (!Number.isNaN(lastModified)) {
            __classPrivateFieldSet(this, _File_lastModified, lastModified, "f");
        }
    }
    static [(_File_name = new WeakMap(), _File_lastModified = new WeakMap(), Symbol.hasInstance)](value) {
        return value instanceof Blob_1.Blob
            && value[Symbol.toStringTag] === "File"
            && typeof value.name === "string";
    }
    get name() {
        return __classPrivateFieldGet(this, _File_name, "f");
    }
    get lastModified() {
        return __classPrivateFieldGet(this, _File_lastModified, "f");
    }
    get webkitRelativePath() {
        return "";
    }
    get [Symbol.toStringTag]() {
        return "File";
    }
}
exports.File = File;

}, function(modId) { var map = {"./Blob":1753149255974}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255974, function(require, module, exports) {

/*! Based on fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> & David Frank */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Blob_parts, _Blob_type, _Blob_size;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blob = void 0;
const web_streams_polyfill_1 = require("web-streams-polyfill");
const isFunction_1 = require("./isFunction");
const blobHelpers_1 = require("./blobHelpers");
class Blob {
    constructor(blobParts = [], options = {}) {
        _Blob_parts.set(this, []);
        _Blob_type.set(this, "");
        _Blob_size.set(this, 0);
        options !== null && options !== void 0 ? options : (options = {});
        if (typeof blobParts !== "object" || blobParts === null) {
            throw new TypeError("Failed to construct 'Blob': "
                + "The provided value cannot be converted to a sequence.");
        }
        if (!(0, isFunction_1.isFunction)(blobParts[Symbol.iterator])) {
            throw new TypeError("Failed to construct 'Blob': "
                + "The object must have a callable @@iterator property.");
        }
        if (typeof options !== "object" && !(0, isFunction_1.isFunction)(options)) {
            throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        const encoder = new TextEncoder();
        for (const raw of blobParts) {
            let part;
            if (ArrayBuffer.isView(raw)) {
                part = new Uint8Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
            }
            else if (raw instanceof ArrayBuffer) {
                part = new Uint8Array(raw.slice(0));
            }
            else if (raw instanceof Blob) {
                part = raw;
            }
            else {
                part = encoder.encode(String(raw));
            }
            __classPrivateFieldSet(this, _Blob_size, __classPrivateFieldGet(this, _Blob_size, "f") + (ArrayBuffer.isView(part) ? part.byteLength : part.size), "f");
            __classPrivateFieldGet(this, _Blob_parts, "f").push(part);
        }
        const type = options.type === undefined ? "" : String(options.type);
        __classPrivateFieldSet(this, _Blob_type, /^[\x20-\x7E]*$/.test(type) ? type : "", "f");
    }
    static [(_Blob_parts = new WeakMap(), _Blob_type = new WeakMap(), _Blob_size = new WeakMap(), Symbol.hasInstance)](value) {
        return Boolean(value
            && typeof value === "object"
            && (0, isFunction_1.isFunction)(value.constructor)
            && ((0, isFunction_1.isFunction)(value.stream)
                || (0, isFunction_1.isFunction)(value.arrayBuffer))
            && /^(Blob|File)$/.test(value[Symbol.toStringTag]));
    }
    get type() {
        return __classPrivateFieldGet(this, _Blob_type, "f");
    }
    get size() {
        return __classPrivateFieldGet(this, _Blob_size, "f");
    }
    slice(start, end, contentType) {
        return new Blob((0, blobHelpers_1.sliceBlob)(__classPrivateFieldGet(this, _Blob_parts, "f"), this.size, start, end), {
            type: contentType
        });
    }
    async text() {
        const decoder = new TextDecoder();
        let result = "";
        for await (const chunk of (0, blobHelpers_1.consumeBlobParts)(__classPrivateFieldGet(this, _Blob_parts, "f"))) {
            result += decoder.decode(chunk, { stream: true });
        }
        result += decoder.decode();
        return result;
    }
    async arrayBuffer() {
        const view = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of (0, blobHelpers_1.consumeBlobParts)(__classPrivateFieldGet(this, _Blob_parts, "f"))) {
            view.set(chunk, offset);
            offset += chunk.length;
        }
        return view.buffer;
    }
    stream() {
        const iterator = (0, blobHelpers_1.consumeBlobParts)(__classPrivateFieldGet(this, _Blob_parts, "f"), true);
        return new web_streams_polyfill_1.ReadableStream({
            async pull(controller) {
                const { value, done } = await iterator.next();
                if (done) {
                    return queueMicrotask(() => controller.close());
                }
                controller.enqueue(value);
            },
            async cancel() {
                await iterator.return();
            }
        });
    }
    get [Symbol.toStringTag]() {
        return "Blob";
    }
}
exports.Blob = Blob;
Object.defineProperties(Blob.prototype, {
    type: { enumerable: true },
    size: { enumerable: true },
    slice: { enumerable: true },
    stream: { enumerable: true },
    text: { enumerable: true },
    arrayBuffer: { enumerable: true }
});

}, function(modId) { var map = {"./isFunction":1753149255975,"./blobHelpers":1753149255976}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255975, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.isFunction = void 0;
const isFunction = (value) => (typeof value === "function");
exports.isFunction = isFunction;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255976, function(require, module, exports) {

/*! Based on fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> & David Frank */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sliceBlob = exports.consumeBlobParts = void 0;
const isFunction_1 = require("./isFunction");
const CHUNK_SIZE = 65536;
async function* clonePart(part) {
    const end = part.byteOffset + part.byteLength;
    let position = part.byteOffset;
    while (position !== end) {
        const size = Math.min(end - position, CHUNK_SIZE);
        const chunk = part.buffer.slice(position, position + size);
        position += chunk.byteLength;
        yield new Uint8Array(chunk);
    }
}
async function* consumeNodeBlob(blob) {
    let position = 0;
    while (position !== blob.size) {
        const chunk = blob.slice(position, Math.min(blob.size, position + CHUNK_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
    }
}
async function* consumeBlobParts(parts, clone = false) {
    for (const part of parts) {
        if (ArrayBuffer.isView(part)) {
            if (clone) {
                yield* clonePart(part);
            }
            else {
                yield part;
            }
        }
        else if ((0, isFunction_1.isFunction)(part.stream)) {
            yield* part.stream();
        }
        else {
            yield* consumeNodeBlob(part);
        }
    }
}
exports.consumeBlobParts = consumeBlobParts;
function* sliceBlob(blobParts, blobSize, start = 0, end) {
    end !== null && end !== void 0 ? end : (end = blobSize);
    let relativeStart = start < 0
        ? Math.max(blobSize + start, 0)
        : Math.min(start, blobSize);
    let relativeEnd = end < 0
        ? Math.max(blobSize + end, 0)
        : Math.min(end, blobSize);
    const span = Math.max(relativeEnd - relativeStart, 0);
    let added = 0;
    for (const part of blobParts) {
        if (added >= span) {
            break;
        }
        const partSize = ArrayBuffer.isView(part) ? part.byteLength : part.size;
        if (relativeStart && partSize <= relativeStart) {
            relativeStart -= partSize;
            relativeEnd -= partSize;
        }
        else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
                chunk = part.subarray(relativeStart, Math.min(partSize, relativeEnd));
                added += chunk.byteLength;
            }
            else {
                chunk = part.slice(relativeStart, Math.min(partSize, relativeEnd));
                added += chunk.size;
            }
            relativeEnd -= partSize;
            relativeStart = 0;
            yield chunk;
        }
    }
}
exports.sliceBlob = sliceBlob;

}, function(modId) { var map = {"./isFunction":1753149255975}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255977, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.isFile = void 0;
const File_1 = require("./File");
const isFile = (value) => value instanceof File_1.File;
exports.isFile = isFile;

}, function(modId) { var map = {"./File":1753149255973}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255978, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.isBlob = void 0;
const Blob_1 = require("./Blob");
const isBlob = (value) => value instanceof Blob_1.Blob;
exports.isBlob = isBlob;

}, function(modId) { var map = {"./Blob":1753149255974}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255979, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.deprecateConstructorEntries = void 0;
const util_1 = require("util");
exports.deprecateConstructorEntries = (0, util_1.deprecate)(() => { }, "Constructor \"entries\" argument is not spec-compliant "
    + "and will be removed in next major release.");

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1753149255971);
})()
//miniprogram-npm-outsideDeps=["util","web-streams-polyfill"]
//# sourceMappingURL=index.js.map