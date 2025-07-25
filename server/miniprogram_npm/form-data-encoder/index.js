module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1753149255958, function(require, module, exports) {

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
__exportStar(require("./FormDataEncoder"), exports);
__exportStar(require("./FileLike"), exports);
__exportStar(require("./FormDataLike"), exports);
__exportStar(require("./util/isFileLike"), exports);
__exportStar(require("./util/isFormData"), exports);

}, function(modId) {var map = {"./FormDataEncoder":1753149255959,"./FileLike":1753149255967,"./FormDataLike":1753149255968,"./util/isFileLike":1753149255964,"./util/isFormData":1753149255966}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255959, function(require, module, exports) {

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FormDataEncoder_instances, _FormDataEncoder_CRLF, _FormDataEncoder_CRLF_BYTES, _FormDataEncoder_CRLF_BYTES_LENGTH, _FormDataEncoder_DASHES, _FormDataEncoder_encoder, _FormDataEncoder_footer, _FormDataEncoder_form, _FormDataEncoder_options, _FormDataEncoder_getFieldHeader;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encoder = exports.FormDataEncoder = void 0;
const createBoundary_1 = __importDefault(require("./util/createBoundary"));
const isPlainObject_1 = __importDefault(require("./util/isPlainObject"));
const normalizeValue_1 = __importDefault(require("./util/normalizeValue"));
const escapeName_1 = __importDefault(require("./util/escapeName"));
const isFileLike_1 = require("./util/isFileLike");
const isFormData_1 = require("./util/isFormData");
const defaultOptions = {
    enableAdditionalHeaders: false
};
class FormDataEncoder {
    constructor(form, boundaryOrOptions, options) {
        _FormDataEncoder_instances.add(this);
        _FormDataEncoder_CRLF.set(this, "\r\n");
        _FormDataEncoder_CRLF_BYTES.set(this, void 0);
        _FormDataEncoder_CRLF_BYTES_LENGTH.set(this, void 0);
        _FormDataEncoder_DASHES.set(this, "-".repeat(2));
        _FormDataEncoder_encoder.set(this, new TextEncoder());
        _FormDataEncoder_footer.set(this, void 0);
        _FormDataEncoder_form.set(this, void 0);
        _FormDataEncoder_options.set(this, void 0);
        if (!(0, isFormData_1.isFormData)(form)) {
            throw new TypeError("Expected first argument to be a FormData instance.");
        }
        let boundary;
        if ((0, isPlainObject_1.default)(boundaryOrOptions)) {
            options = boundaryOrOptions;
        }
        else {
            boundary = boundaryOrOptions;
        }
        if (!boundary) {
            boundary = (0, createBoundary_1.default)();
        }
        if (typeof boundary !== "string") {
            throw new TypeError("Expected boundary argument to be a string.");
        }
        if (options && !(0, isPlainObject_1.default)(options)) {
            throw new TypeError("Expected options argument to be an object.");
        }
        __classPrivateFieldSet(this, _FormDataEncoder_form, form, "f");
        __classPrivateFieldSet(this, _FormDataEncoder_options, { ...defaultOptions, ...options }, "f");
        __classPrivateFieldSet(this, _FormDataEncoder_CRLF_BYTES, __classPrivateFieldGet(this, _FormDataEncoder_encoder, "f").encode(__classPrivateFieldGet(this, _FormDataEncoder_CRLF, "f")), "f");
        __classPrivateFieldSet(this, _FormDataEncoder_CRLF_BYTES_LENGTH, __classPrivateFieldGet(this, _FormDataEncoder_CRLF_BYTES, "f").byteLength, "f");
        this.boundary = `form-data-boundary-${boundary}`;
        this.contentType = `multipart/form-data; boundary=${this.boundary}`;
        __classPrivateFieldSet(this, _FormDataEncoder_footer, __classPrivateFieldGet(this, _FormDataEncoder_encoder, "f").encode(`${__classPrivateFieldGet(this, _FormDataEncoder_DASHES, "f")}${this.boundary}${__classPrivateFieldGet(this, _FormDataEncoder_DASHES, "f")}${__classPrivateFieldGet(this, _FormDataEncoder_CRLF, "f").repeat(2)}`), "f");
        this.contentLength = String(this.getContentLength());
        this.headers = Object.freeze({
            "Content-Type": this.contentType,
            "Content-Length": this.contentLength
        });
        Object.defineProperties(this, {
            boundary: { writable: false, configurable: false },
            contentType: { writable: false, configurable: false },
            contentLength: { writable: false, configurable: false },
            headers: { writable: false, configurable: false }
        });
    }
    getContentLength() {
        let length = 0;
        for (const [name, raw] of __classPrivateFieldGet(this, _FormDataEncoder_form, "f")) {
            const value = (0, isFileLike_1.isFileLike)(raw) ? raw : __classPrivateFieldGet(this, _FormDataEncoder_encoder, "f").encode((0, normalizeValue_1.default)(raw));
            length += __classPrivateFieldGet(this, _FormDataEncoder_instances, "m", _FormDataEncoder_getFieldHeader).call(this, name, value).byteLength;
            length += (0, isFileLike_1.isFileLike)(value) ? value.size : value.byteLength;
            length += __classPrivateFieldGet(this, _FormDataEncoder_CRLF_BYTES_LENGTH, "f");
        }
        return length + __classPrivateFieldGet(this, _FormDataEncoder_footer, "f").byteLength;
    }
    *values() {
        for (const [name, raw] of __classPrivateFieldGet(this, _FormDataEncoder_form, "f").entries()) {
            const value = (0, isFileLike_1.isFileLike)(raw) ? raw : __classPrivateFieldGet(this, _FormDataEncoder_encoder, "f").encode((0, normalizeValue_1.default)(raw));
            yield __classPrivateFieldGet(this, _FormDataEncoder_instances, "m", _FormDataEncoder_getFieldHeader).call(this, name, value);
            yield value;
            yield __classPrivateFieldGet(this, _FormDataEncoder_CRLF_BYTES, "f");
        }
        yield __classPrivateFieldGet(this, _FormDataEncoder_footer, "f");
    }
    async *encode() {
        for (const part of this.values()) {
            if ((0, isFileLike_1.isFileLike)(part)) {
                yield* part.stream();
            }
            else {
                yield part;
            }
        }
    }
    [(_FormDataEncoder_CRLF = new WeakMap(), _FormDataEncoder_CRLF_BYTES = new WeakMap(), _FormDataEncoder_CRLF_BYTES_LENGTH = new WeakMap(), _FormDataEncoder_DASHES = new WeakMap(), _FormDataEncoder_encoder = new WeakMap(), _FormDataEncoder_footer = new WeakMap(), _FormDataEncoder_form = new WeakMap(), _FormDataEncoder_options = new WeakMap(), _FormDataEncoder_instances = new WeakSet(), _FormDataEncoder_getFieldHeader = function _FormDataEncoder_getFieldHeader(name, value) {
        let header = "";
        header += `${__classPrivateFieldGet(this, _FormDataEncoder_DASHES, "f")}${this.boundary}${__classPrivateFieldGet(this, _FormDataEncoder_CRLF, "f")}`;
        header += `Content-Disposition: form-data; name="${(0, escapeName_1.default)(name)}"`;
        if ((0, isFileLike_1.isFileLike)(value)) {
            header += `; filename="${(0, escapeName_1.default)(value.name)}"${__classPrivateFieldGet(this, _FormDataEncoder_CRLF, "f")}`;
            header += `Content-Type: ${value.type || "application/octet-stream"}`;
        }
        if (__classPrivateFieldGet(this, _FormDataEncoder_options, "f").enableAdditionalHeaders === true) {
            header += `${__classPrivateFieldGet(this, _FormDataEncoder_CRLF, "f")}Content-Length: ${(0, isFileLike_1.isFileLike)(value) ? value.size : value.byteLength}`;
        }
        return __classPrivateFieldGet(this, _FormDataEncoder_encoder, "f").encode(`${header}${__classPrivateFieldGet(this, _FormDataEncoder_CRLF, "f").repeat(2)}`);
    }, Symbol.iterator)]() {
        return this.values();
    }
    [Symbol.asyncIterator]() {
        return this.encode();
    }
}
exports.FormDataEncoder = FormDataEncoder;
exports.Encoder = FormDataEncoder;

}, function(modId) { var map = {"./util/createBoundary":1753149255960,"./util/isPlainObject":1753149255961,"./util/normalizeValue":1753149255962,"./util/escapeName":1753149255963,"./util/isFileLike":1753149255964,"./util/isFormData":1753149255966}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255960, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
function createBoundary() {
    let size = 16;
    let res = "";
    while (size--) {
        res += alphabet[(Math.random() * alphabet.length) << 0];
    }
    return res;
}
exports.default = createBoundary;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255961, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const getType = (value) => (Object.prototype.toString.call(value).slice(8, -1).toLowerCase());
function isPlainObject(value) {
    if (getType(value) !== "object") {
        return false;
    }
    const pp = Object.getPrototypeOf(value);
    if (pp === null || pp === undefined) {
        return true;
    }
    const Ctor = pp.constructor && pp.constructor.toString();
    return Ctor === Object.toString();
}
exports.default = isPlainObject;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255962, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const normalizeValue = (value) => String(value)
    .replace(/\r|\n/g, (match, i, str) => {
    if ((match === "\r" && str[i + 1] !== "\n")
        || (match === "\n" && str[i - 1] !== "\r")) {
        return "\r\n";
    }
    return match;
});
exports.default = normalizeValue;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255963, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const escapeName = (name) => String(name)
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/"/g, "%22");
exports.default = escapeName;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255964, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFileLike = void 0;
const isFunction_1 = __importDefault(require("./isFunction"));
const isFileLike = (value) => Boolean(value
    && typeof value === "object"
    && (0, isFunction_1.default)(value.constructor)
    && value[Symbol.toStringTag] === "File"
    && (0, isFunction_1.default)(value.stream)
    && value.name != null
    && value.size != null
    && value.lastModified != null);
exports.isFileLike = isFileLike;

}, function(modId) { var map = {"./isFunction":1753149255965}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255965, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const isFunction = (value) => (typeof value === "function");
exports.default = isFunction;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255966, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFormDataLike = exports.isFormData = void 0;
const isFunction_1 = __importDefault(require("./isFunction"));
const isFormData = (value) => Boolean(value
    && (0, isFunction_1.default)(value.constructor)
    && value[Symbol.toStringTag] === "FormData"
    && (0, isFunction_1.default)(value.append)
    && (0, isFunction_1.default)(value.getAll)
    && (0, isFunction_1.default)(value.entries)
    && (0, isFunction_1.default)(value[Symbol.iterator]));
exports.isFormData = isFormData;
exports.isFormDataLike = exports.isFormData;

}, function(modId) { var map = {"./isFunction":1753149255965}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255967, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1753149255968, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1753149255958);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map