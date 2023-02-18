"use strict";
/**
 * SCRU128: Sortable, Clock and Random number-based Unique identifier
 *
 * @example
 * ```javascript
 * import { scru128, scru128String } from "scru128";
 * // or on browsers:
 * // import { scru128, scru128String } from "https://unpkg.com/scru128@^2";
 *
 * // generate a new identifier object
 * const x = scru128();
 * console.log(String(x)); // e.g. "036Z951MHJIKZIK2GSL81GR7L"
 * console.log(BigInt(x.toHex())); // as a 128-bit unsigned integer
 *
 * // generate a textual representation directly
 * console.log(scru128String()); // e.g. "036Z951MHZX67T63MQ9XE6Q0J"
 * ```
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scru128String = exports.scru128 = exports._setRandom = exports.Scru128Generator = exports.Scru128Id = void 0;
/** Maximum value of 48-bit `timestamp` field. */
const MAX_TIMESTAMP = 281474976710655;
/** Maximum value of 24-bit `counter_hi` field. */
const MAX_COUNTER_HI = 16777215;
/** Maximum value of 24-bit `counter_lo` field. */
const MAX_COUNTER_LO = 16777215;
/** Digit characters used in the Base36 notation. */
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** O(1) map from ASCII code points to Base36 digit values. */
const DECODE_MAP = [
    0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
    0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
    0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
    0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x00, 0x01, 0x02, 0x03,
    0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
    0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
    0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23,
    0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
    0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
    0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
];
/**
 * Represents a SCRU128 ID and provides converters and comparison operators.
 *
 * @example
 * ```javascript
 * import { Scru128Id } from "scru128";
 *
 * const x = Scru128Id.fromString("036Z968FU2TUGY7SVKFZNEWKK");
 * console.log(String(x));
 *
 * const y = Scru128Id.fromHex(0x017fa1de51a80fd992f9e8cc2d5eb88en.toString(16));
 * console.log(BigInt(y.toHex()));
 * ```
 */
class Scru128Id {
    /** Creates an object from a 16-byte byte array. */
    constructor(bytes) {
        this.bytes = bytes;
        if (bytes.length !== 16) {
            throw new TypeError("invalid length of byte array: " + bytes.length);
        }
    }
    /**
     * Creates an object from the internal representation, a 16-byte byte array
     * containing the 128-bit unsigned integer representation in the big-endian
     * (network) byte order.
     *
     * This method does NOT shallow-copy the argument, and thus the created object
     * holds the reference to the underlying buffer.
     *
     * @throws TypeError if the length of the argument is not 16.
     */
    static ofInner(bytes) {
        return new Scru128Id(bytes);
    }
    /**
     * Creates an object from field values.
     *
     * @param timestamp - 48-bit `timestamp` field value.
     * @param counterHi - 24-bit `counter_hi` field value.
     * @param counterLo - 24-bit `counter_lo` field value.
     * @param entropy - 32-bit `entropy` field value.
     * @throws RangeError if any argument is out of the value range of the field.
     * @category Conversion
     */
    static fromFields(timestamp, counterHi, counterLo, entropy) {
        if (!Number.isInteger(timestamp) ||
            !Number.isInteger(counterHi) ||
            !Number.isInteger(counterLo) ||
            !Number.isInteger(entropy) ||
            timestamp < 0 ||
            counterHi < 0 ||
            counterLo < 0 ||
            entropy < 0 ||
            timestamp > MAX_TIMESTAMP ||
            counterHi > MAX_COUNTER_HI ||
            counterLo > MAX_COUNTER_LO ||
            entropy > 4294967295) {
            throw new RangeError("invalid field value");
        }
        const bytes = new Uint8Array(16);
        bytes[0] = timestamp / 1099511627776;
        bytes[1] = timestamp / 4294967296;
        bytes[2] = timestamp >>> 24;
        bytes[3] = timestamp >>> 16;
        bytes[4] = timestamp >>> 8;
        bytes[5] = timestamp;
        bytes[6] = counterHi >>> 16;
        bytes[7] = counterHi >>> 8;
        bytes[8] = counterHi;
        bytes[9] = counterLo >>> 16;
        bytes[10] = counterLo >>> 8;
        bytes[11] = counterLo;
        bytes[12] = entropy >>> 24;
        bytes[13] = entropy >>> 16;
        bytes[14] = entropy >>> 8;
        bytes[15] = entropy;
        return new Scru128Id(bytes);
    }
    /** Returns the 48-bit `timestamp` field value. */
    get timestamp() {
        return this.subUint(0, 6);
    }
    /** Returns the 24-bit `counter_hi` field value. */
    get counterHi() {
        return this.subUint(6, 9);
    }
    /** Returns the 24-bit `counter_lo` field value. */
    get counterLo() {
        return this.subUint(9, 12);
    }
    /** Returns the 32-bit `entropy` field value. */
    get entropy() {
        return this.subUint(12, 16);
    }
    /**
     * Creates an object from a 25-digit string representation.
     *
     * @throws SyntaxError if the argument is not a valid string representation.
     * @category Conversion
     */
    static fromString(value) {
        var _a;
        if (value.length !== 25) {
            throw new SyntaxError("invalid length: " + value.length);
        }
        const src = new Uint8Array(25);
        for (let i = 0; i < 25; i++) {
            src[i] = (_a = DECODE_MAP[value.charCodeAt(i)]) !== null && _a !== void 0 ? _a : 0x7f;
        }
        return Scru128Id.fromDigitValues(src);
    }
    /**
     * Creates an object from an array of Base36 digit values representing a
     * 25-digit string representation.
     *
     * @throws SyntaxError if the argument does not contain a valid string
     * representation.
     * @category Conversion
     */
    static fromDigitValues(src) {
        if (src.length !== 25) {
            throw new SyntaxError("invalid length: " + src.length);
        }
        const dst = new Uint8Array(16);
        let minIndex = 99; // any number greater than size of output array
        for (let i = -7; i < 25; i += 8) {
            // implement Base36 using 8-digit words
            let carry = 0;
            for (let j = i < 0 ? 0 : i; j < i + 8; j++) {
                const e = src[j];
                if (e < 0 || e > 35 || !Number.isInteger(e)) {
                    throw new SyntaxError("invalid digit");
                }
                carry = carry * 36 + e;
            }
            // iterate over output array from right to left while carry != 0 but at
            // least up to place already filled
            let j = dst.length - 1;
            for (; carry > 0 || j > minIndex; j--) {
                if (j < 0) {
                    throw new SyntaxError("out of 128-bit value range");
                }
                carry += dst[j] * 2821109907456; // 36 ** 8
                const quo = Math.trunc(carry / 0x100);
                dst[j] = carry & 0xff; // remainder
                carry = quo;
            }
            minIndex = j;
        }
        return new Scru128Id(dst);
    }
    /**
     * Returns the 25-digit canonical string representation.
     *
     * @category Conversion
     */
    toString() {
        const dst = new Uint8Array(25);
        let minIndex = 99; // any number greater than size of output array
        for (let i = -4; i < 16; i += 5) {
            // implement Base36 using 40-bit words
            let carry = this.subUint(i < 0 ? 0 : i, i + 5);
            // iterate over output array from right to left while carry != 0 but at
            // least up to place already filled
            let j = dst.length - 1;
            for (; carry > 0 || j > minIndex; j--) {
                // console.assert(j >= 0);
                carry += dst[j] * 1099511627776;
                const quo = Math.trunc(carry / 36);
                dst[j] = carry - quo * 36; // remainder
                carry = quo;
            }
            minIndex = j;
        }
        let text = "";
        for (let d of dst) {
            text += DIGITS.charAt(d);
        }
        return text;
    }
    /**
     * Creates an object from a byte array representing either a 128-bit unsigned
     * integer or a 25-digit Base36 string.
     *
     * This method shallow-copies the content of the argument, so the created
     * object holds another instance of the byte array.
     *
     * @param value - an array of 16 bytes that contains a 128-bit unsigned
     * integer in the big-endian (network) byte order or an array of 25 ASCII code
     * points that reads a 25-digit Base36 string.
     * @throws SyntaxError if conversion fails.
     * @category Conversion
     */
    static fromBytes(value) {
        for (let i = 0; i < value.length; i++) {
            const e = value[i];
            if (e < 0 || e > 0xff || !Number.isInteger(e)) {
                throw new SyntaxError("invalid byte value");
            }
        }
        if (value.length === 16) {
            return new Scru128Id(Uint8Array.from(value));
        }
        else {
            return Scru128Id.fromDigitValues(Uint8Array.from(value, (c) => { var _a; return (_a = DECODE_MAP[c]) !== null && _a !== void 0 ? _a : 0x7f; }));
        }
    }
    /**
     * Creates an object from a byte array that represents a 128-bit unsigned
     * integer.
     *
     * This method shallow-copies the content of the argument, so the created
     * object holds another instance of the byte array.
     *
     * @param value - 16-byte buffer that represents a 128-bit unsigned integer in
     * the big-endian (network) byte order.
     * @throws TypeError if the byte length of the argument is not 16.
     * @category Conversion
     */
    static fromArrayBuffer(value) {
        if (value.byteLength !== 16) {
            throw new TypeError("invalid length of byte array: " + value.byteLength);
        }
        return new Scru128Id(new Uint8Array(value.slice(0)));
    }
    /**
     * Returns a 16-byte byte array containing the 128-bit unsigned integer
     * representation in the big-endian (network) byte order.
     *
     * @category Conversion
     */
    toArrayBuffer() {
        return this.bytes.buffer.slice(0);
    }
    /**
     * Creates an object from a 128-bit unsigned integer encoded in a hexadecimal
     * string.
     *
     * @throws SyntaxError if the argument is not a hexadecimal string encoding a
     * 128-bit unsigned integer.
     * @category Conversion
     */
    static fromHex(value) {
        const m = value.match(/^(?:0x)?0*(0|[1-9a-f][0-9a-f]*)$/i);
        if (m === null || m[1].length > 32) {
            throw new SyntaxError("invalid hexadecimal integer");
        }
        const gap = 32 - m[1].length;
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            const pos = i * 2 - gap;
            bytes[i] =
                (pos < 0 ? 0 : DECODE_MAP[m[1].charCodeAt(pos)] << 4) |
                    (pos + 1 < 0 ? 0 : DECODE_MAP[m[1].charCodeAt(pos + 1)]);
        }
        return new Scru128Id(bytes);
    }
    /**
     * Returns the 128-bit unsigned integer representation as a 32-digit
     * hexadecimal string prefixed with "0x".
     *
     * @category Conversion
     */
    toHex() {
        const digits = "0123456789abcdef";
        let text = "0x";
        for (let e of this.bytes) {
            text += digits.charAt(e >>> 4);
            text += digits.charAt(e & 0xf);
        }
        return text;
    }
    /** Represents `this` in JSON as a 25-digit canonical string. */
    toJSON() {
        return this.toString();
    }
    /**
     * Creates an object from `this`.
     *
     * Note that this class is designed to be immutable, and thus `clone()` is not
     * necessary unless properties marked as private are modified directly.
     */
    clone() {
        return new Scru128Id(this.bytes.slice(0));
    }
    /** Returns true if `this` is equivalent to `other`. */
    equals(other) {
        return this.compareTo(other) === 0;
    }
    /**
     * Returns a negative integer, zero, or positive integer if `this` is less
     * than, equal to, or greater than `other`, respectively.
     */
    compareTo(other) {
        for (let i = 0; i < 16; i++) {
            const diff = this.bytes[i] - other.bytes[i];
            if (diff !== 0) {
                return Math.sign(diff);
            }
        }
        return 0;
    }
    /** Returns a part of `bytes` as an unsigned integer. */
    subUint(beginIndex, endIndex) {
        let buffer = 0;
        while (beginIndex < endIndex) {
            buffer = buffer * 0x100 + this.bytes[beginIndex++];
        }
        return buffer;
    }
}
exports.Scru128Id = Scru128Id;
/**
 * Represents a SCRU128 ID generator that encapsulates the monotonic counters
 * and other internal states.
 *
 * @example
 * ```javascript
 * import { Scru128Generator } from "scru128";
 *
 * const g = new Scru128Generator();
 * const x = g.generate();
 * console.log(String(x));
 * console.log(BigInt(x.toHex()));
 * ```
 */
class Scru128Generator {
    /**
     * Creates a generator object with the default random number generator, or
     * with the specified one if passed as an argument. The specified random
     * number generator should be cryptographically strong and securely seeded.
     */
    constructor(randomNumberGenerator) {
        this.timestamp = 0;
        this.counterHi = 0;
        this.counterLo = 0;
        /** Timestamp at the last renewal of `counter_hi` field. */
        this.tsCounterHi = 0;
        /** Status code reported at the last generation. */
        this.lastStatus = "NOT_EXECUTED";
        this.rng = randomNumberGenerator || new DefaultRandom();
    }
    /** Generates a new SCRU128 ID object. */
    generate() {
        return this.generateCore(Date.now());
    }
    /**
     * Generates a new SCRU128 ID object with the `timestamp` passed.
     *
     * @throws RangeError if the argument is not a 48-bit positive integer.
     */
    generateCore(timestamp) {
        if (!Number.isInteger(timestamp) ||
            timestamp < 1 ||
            timestamp > MAX_TIMESTAMP) {
            throw new RangeError("`timestamp` must be a 48-bit positive integer");
        }
        this.lastStatus = "NEW_TIMESTAMP";
        if (timestamp > this.timestamp) {
            this.timestamp = timestamp;
            this.counterLo = this.rng.nextUint32() & MAX_COUNTER_LO;
        }
        else if (timestamp + 10000 > this.timestamp) {
            this.counterLo++;
            this.lastStatus = "COUNTER_LO_INC";
            if (this.counterLo > MAX_COUNTER_LO) {
                this.counterLo = 0;
                this.counterHi++;
                this.lastStatus = "COUNTER_HI_INC";
                if (this.counterHi > MAX_COUNTER_HI) {
                    this.counterHi = 0;
                    // increment timestamp at counter overflow
                    this.timestamp++;
                    this.counterLo = this.rng.nextUint32() & MAX_COUNTER_LO;
                    this.lastStatus = "TIMESTAMP_INC";
                }
            }
        }
        else {
            // reset state if clock moves back by ten seconds or more
            this.tsCounterHi = 0;
            this.timestamp = timestamp;
            this.counterLo = this.rng.nextUint32() & MAX_COUNTER_LO;
            this.lastStatus = "CLOCK_ROLLBACK";
        }
        if (this.timestamp - this.tsCounterHi >= 1000 || this.tsCounterHi < 1) {
            this.tsCounterHi = this.timestamp;
            this.counterHi = this.rng.nextUint32() & MAX_COUNTER_HI;
        }
        return Scru128Id.fromFields(this.timestamp, this.counterHi, this.counterLo, this.rng.nextUint32());
    }
    /**
     * Returns a status code that indicates the internal state involved in the
     * last generation of ID.
     *
     * - `"NOT_EXECUTED"` indicates that the generator has yet to generate an ID.
     * - `"NEW_TIMESTAMP"` indicates that the latest timestamp was used because it
     *   was greater than the previous one.
     * - `"COUNTER_LO_INC"` indicates that counter_lo was incremented because the
     *   latest timestamp was no greater than the previous one.
     * - `"COUNTER_HI_INC"` indicates that counter_hi was incremented because
     *   counter_lo reached its maximum value.
     * - `"TIMESTAMP_INC"` indicates that the previous timestamp was incremented
     *   because counter_hi reached its maximum value.
     * - `"CLOCK_ROLLBACK"` indicates that the monotonic order of generated IDs
     *   was broken because the latest timestamp was less than the previous one by
     *   ten seconds or more.
     *
     * @example
     * ```javascript
     * import { Scru128Generator } from "scru128";
     *
     * const g = new Scru128Generator();
     * const x = g.generate();
     * const y = g.generate();
     * if (g.getLastStatus() === "CLOCK_ROLLBACK") {
     *   throw new Error("clock moved backward");
     * } else {
     *   console.assert(x.compareTo(y) < 0);
     * }
     * ```
     */
    getLastStatus() {
        return this.lastStatus;
    }
    /**
     * Returns an infinite iterator object that produces a new ID for each call of
     * `next()`.
     *
     * @example
     * ```javascript
     * import { Scru128Generator } from "scru128";
     *
     * const [a, b, c] = new Scru128Generator();
     * console.log(String(a)); // e.g. "038MQR9E14CJC12DH9AMW7I5O"
     * console.log(String(b)); // e.g. "038MQR9E14CJC12DH9DTPWFR3"
     * console.log(String(c)); // e.g. "038MQR9E14CJC12DH9E6RJMQI"
     * ```
     */
    [Symbol.iterator]() {
        return this;
    }
    /**
     * Returns a new SCRU128 ID object for each call, infinitely.
     *
     * This method wraps the result of {@link generate | generate()} in an
     * [`IteratorResult`] object to use `this` as an infinite iterator.
     *
     * [`IteratorResult`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Iteration_protocols
     */
    next() {
        return { value: this.generate(), done: false };
    }
}
exports.Scru128Generator = Scru128Generator;
/** Stores `crypto.getRandomValues()` available in the environment. */
let getRandomValues = (buffer) => {
    // fall back on Math.random() unless the flag is set to true
    if (typeof SCRU128_DENY_WEAK_RNG !== "undefined" && SCRU128_DENY_WEAK_RNG) {
        throw new Error("no cryptographically strong RNG available");
    }
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] =
            Math.trunc(Math.random() * 65536) * 65536 +
                Math.trunc(Math.random() * 65536);
    }
    return buffer;
};
// detect Web Crypto API
if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    getRandomValues = (buffer) => crypto.getRandomValues(buffer);
}
/** @internal */
const _setRandom = (rand) => {
    getRandomValues = rand;
};
exports._setRandom = _setRandom;
/**
 * Wraps `crypto.getRandomValues()` and compatibles to enable buffering; this
 * uses a small buffer by default to avoid unbearable throughput decline in some
 * environments as well as the waste of time and space for unused values.
 */
class DefaultRandom {
    constructor() {
        this.buffer = new Uint32Array(8);
        this.cursor = Infinity;
    }
    nextUint32() {
        if (this.cursor >= this.buffer.length) {
            getRandomValues(this.buffer);
            this.cursor = 0;
        }
        return this.buffer[this.cursor++];
    }
}
let defaultGenerator;
/** Generates a new SCRU128 ID object. */
const scru128 = () => (defaultGenerator || (defaultGenerator = new Scru128Generator())).generate();
exports.scru128 = scru128;
/**
 * Generates a new SCRU128 ID encoded in a string.
 *
 * Use this function to quickly get a new SCRU128 ID as a string.
 *
 * @returns 25-digit canonical string representation.
 * @example
 * ```javascript
 * import { scru128String } from "scru128";
 *
 * const x = scru128String();
 * console.log(x);
 * ```
 */
const scru128String = () => (0, exports.scru128)().toString();
exports.scru128String = scru128String;
