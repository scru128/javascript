"use strict";
/**
 * SCRU128: Sortable, Clock and Random number-based Unique identifier
 *
 * @example
 * ```javascript
 * import { scru128 } from "scru128";
 *
 * console.log(scru128()); // e.g. "00PGHAJ3Q9VAJ7IU6PQBHBUAK4"
 * console.log(scru128()); // e.g. "00PGHAJ3Q9VAJ7KU6PQ92NVBTV"
 * ```
 *
 * @license Apache-2.0
 * @copyright 2021 LiosK
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scru128 = exports.Scru128Id = exports.Scru128Generator = exports.TIMESTAMP_BIAS = void 0;
const crypto_1 = require("crypto");
/** Unix time in milliseconds at 2020-01-01 00:00:00+00:00. */
exports.TIMESTAMP_BIAS = 1577836800000; // Date.UTC(2020, 0)
/** Maximum value of 28-bit counter field. */
const MAX_COUNTER = 268435455;
/** Leading zeros to polyfill padStart(n, "0") with slice(-n). */
const PAD_ZEROS = "0000000000000000";
/** Returns a random number generator based on available cryptographic RNG. */
const detectRng = () => {
    if (typeof window !== "undefined" && window.crypto) {
        // Web Crypto API on browsers
        return () => window.crypto.getRandomValues(new Uint32Array(1))[0];
    }
    else if (crypto_1.randomFillSync) {
        // Node.js Crypto
        return () => (0, crypto_1.randomFillSync)(new Uint32Array(1))[0];
    }
    else {
        console.warn("scru128: fell back on Math.random() as no cryptographic RNG was detected");
        return () => Math.trunc(Math.random() * 65536) * 65536 +
            Math.trunc(Math.random() * 65536);
    }
};
/**
 * Represents a SCRU128 ID generator and provides an interface to do more than
 * just generate a string representation.
 *
 * @example
 * ```javascript
 * import { Scru128Generator } from "scru128";
 *
 * const g = new Scru128Generator();
 * const x = g.generate();
 * console.log(x.toString());
 * console.log(BigInt(x.toHex()));
 * ```
 */
class Scru128Generator {
    constructor() {
        /** Timestamp at last generation. */
        this.tsLastGen = 0;
        /** Counter at last generation. */
        this.counter = 0;
        /** Timestamp at last renewal of perSecRandom. */
        this.tsLastSec = 0;
        /** Per-second random value at last generation. */
        this.perSecRandom = 0;
        /** Maximum number of checking `Date.now()` until clock goes forward. */
        this.nClockCheckMax = 1000000;
        /** Returns a 32-bit (cryptographically strong) random unsigned integer. */
        this.getRandomUint32 = detectRng();
    }
    /** Generates a new SCRU128 ID object. */
    generate() {
        let tsNow = Date.now();
        // update timestamp and counter
        if (tsNow > this.tsLastGen) {
            this.tsLastGen = tsNow;
            this.counter = this.getRandomUint32() >>> 4;
        }
        else if (++this.counter > MAX_COUNTER) {
            console.info("scru128: counter limit reached; will wait until clock goes forward");
            let nClockCheck = 0;
            while (tsNow <= this.tsLastGen) {
                tsNow = Date.now();
                if (++nClockCheck > this.nClockCheckMax) {
                    console.warn("scru128: reset state as clock did not go forward");
                    this.tsLastSec = 0;
                    break;
                }
            }
            this.tsLastGen = tsNow;
            this.counter = this.getRandomUint32() >>> 4;
        }
        // update perSecRandom
        if (this.tsLastGen - this.tsLastSec > 1000) {
            this.tsLastSec = this.tsLastGen;
            this.perSecRandom = this.getRandomUint32() >>> 8;
        }
        return Scru128Id.fromFields(this.tsLastGen - exports.TIMESTAMP_BIAS, this.counter, this.perSecRandom, this.getRandomUint32());
    }
}
exports.Scru128Generator = Scru128Generator;
/**
 * Represents a SCRU128 ID and provides converters to/from string and numbers.
 *
 * @example
 * ```javascript
 * import { Scru128Id } from "scru128";
 *
 * const x = Scru128Id.fromString("00Q1D9AB6DTJNLJ80SJ42SNJ4F");
 * console.log(x.toString());
 *
 * const y = Scru128Id.fromHex(0xd05a952ccdecef5aa01c9904e5a115n.toString(16));
 * console.log(BigInt(y.toHex()));
 * ```
 */
class Scru128Id {
    /** Creates an object from field values. */
    constructor(timestamp, counter, perSecRandom, perGenRandom) {
        this.timestamp = timestamp;
        this.counter = counter;
        this.perSecRandom = perSecRandom;
        this.perGenRandom = perGenRandom;
        if (!Number.isInteger(this.timestamp) ||
            !Number.isInteger(this.counter) ||
            !Number.isInteger(this.perSecRandom) ||
            !Number.isInteger(this.perGenRandom) ||
            this.timestamp < 0 ||
            this.counter < 0 ||
            this.perSecRandom < 0 ||
            this.perGenRandom < 0 ||
            this.timestamp > 17592186044415 ||
            this.counter > MAX_COUNTER ||
            this.perSecRandom > 16777215 ||
            this.perGenRandom > 4294967295) {
            throw new RangeError("invalid field value");
        }
    }
    /**
     * Creates an object from field values.
     *
     * @param timestamp - 44-bit millisecond timestamp field value.
     * @param counter - 28-bit per-timestamp monotonic counter field value.
     * @param perSecRandom - 24-bit per-second randomness field value.
     * @param perGenRandom - 32-bit per-generation randomness field value.
     * @throws RangeError if any argument is out of the range of each field.
     * @category Conversion
     */
    static fromFields(timestamp, counter, perSecRandom, perGenRandom) {
        return new Scru128Id(timestamp, counter, perSecRandom, perGenRandom);
    }
    /**
     * Creates an object from a 26-digit string representation.
     *
     * @throws SyntaxError if the argument is not a valid string representation.
     * @category Conversion
     */
    static fromString(value) {
        const m = value.match(/^([0-7][0-9A-V]{9})([0-9A-V]{8})([0-9A-V]{8})$/i);
        if (m === null) {
            throw new SyntaxError("invalid string representation: " + value);
        }
        const h48 = parseInt(m[1], 32);
        const m40 = parseInt(m[2], 32);
        const l40 = parseInt(m[3], 32);
        return new Scru128Id(Math.trunc(h48 / 0x10), (h48 % 0x10 << 24) | Math.trunc(m40 / 65536), (m40 % 65536 << 8) | Math.trunc(l40 / 4294967296), l40 % 4294967296);
    }
    /**
     * Returns the 26-digit canonical string representation.
     *
     * @category Conversion
     */
    toString() {
        const h48 = this.timestamp * 0x10 + (this.counter >>> 24);
        const m40 = (this.counter & 16777215) * 65536 + (this.perSecRandom >>> 8);
        const l40 = (this.perSecRandom & 0xff) * 4294967296 + this.perGenRandom;
        return ((PAD_ZEROS + h48.toString(32)).slice(-10) +
            (PAD_ZEROS + m40.toString(32)).slice(-8) +
            (PAD_ZEROS + l40.toString(32)).slice(-8)).toUpperCase();
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
            throw new SyntaxError("invalid hexadecimal integer: " + value);
        }
        return new Scru128Id(parseInt(m[1].slice(-32, -21) || "0", 16), parseInt(m[1].slice(-21, -14) || "0", 16), parseInt(m[1].slice(-14, -8) || "0", 16), parseInt(m[1].slice(-8) || "0", 16));
    }
    /**
     * Returns the 128-bit unsigned integer representation as a 32-digit
     * hexadecimal string prefixed with "0x".
     *
     * @category Conversion
     */
    toHex() {
        return ("0x" +
            (PAD_ZEROS + this.timestamp.toString(16)).slice(-11) +
            (PAD_ZEROS + this.counter.toString(16)).slice(-7) +
            (PAD_ZEROS + this.perSecRandom.toString(16)).slice(-6) +
            (PAD_ZEROS + this.perGenRandom.toString(16)).slice(-8));
    }
    /** Represents `this` in JSON as a 26-digit canonical string. */
    toJSON() {
        return this.toString();
    }
    /** Creates an object from `this`. */
    clone() {
        return new Scru128Id(this.timestamp, this.counter, this.perSecRandom, this.perGenRandom);
    }
    /** Returns true if `this` is equivalent to `other`. */
    equals(other) {
        return this.compareTo(other) === 0;
    }
    /**
     * Returns a negative integer, zero, and positive integer if `this` is less
     * than, equal to, and greater than `other`, respectively.
     */
    compareTo(other) {
        return Math.sign(this.timestamp - other.timestamp ||
            this.counter - other.counter ||
            this.perSecRandom - other.perSecRandom ||
            this.perGenRandom - other.perGenRandom);
    }
}
exports.Scru128Id = Scru128Id;
const defaultGenerator = new Scru128Generator();
/**
 * Generates a new SCRU128 ID encoded in a string.
 *
 * Use this function to quickly get a new SCRU128 ID as a string. Use
 * [[Scru128Generator]] to do more.
 *
 * @returns 26-digit canonical string representation.
 * @example
 * ```javascript
 * import { scru128 } from "scru128";
 *
 * const x = scru128();
 * console.log(x);
 * ```
 */
const scru128 = () => defaultGenerator.generate().toString();
exports.scru128 = scru128;
