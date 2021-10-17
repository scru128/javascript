"use strict";
/**
 * SCRU128: Sortable, Clock and Random number-based Unique identifier
 *
 * @license Apache-2.0
 * @copyright 2021 LiosK
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports._internal = exports.scru128 = void 0;
const crypto_1 = require("crypto");
/** Unix time in milliseconds as at 2020-01-01 00:00:00+00:00. */
const TIMESTAMP_EPOCH = 1577836800000; // Date.UTC(2020, 0)
/** Maximum value of 28-bit counter field. */
const MAX_COUNTER = 268435455;
/** Returns a random bit generator based on available cryptographic RNG. */
const detectRng = () => {
    if (typeof window !== "undefined" && window.crypto) {
        // Web Crypto API on browsers
        return (k) => window.crypto
            .getRandomValues(new Uint16Array(Math.ceil(k / 16)))
            .reduce((acc, e) => acc * 65536 + e) %
            Math.pow(2, k); // Caution: the result overflows if k > 48
    }
    else if (crypto_1.randomFillSync) {
        // Node.js Crypto
        return (k) => (0, crypto_1.randomFillSync)(new Uint16Array(Math.ceil(k / 16))).reduce((acc, e) => acc * 65536 + e) %
            Math.pow(2, k); // Caution: the result overflows if k > 48
    }
    else {
        console.warn("scru128: fell back on Math.random() as no cryptographic RNG was detected");
        return (k) => k > 30
            ? Math.trunc(Math.random() * Math.pow(2, (k - 30))) * 1073741824 +
                Math.trunc(Math.random() * 1073741824)
            : Math.trunc(Math.random() * Math.pow(2, k));
    }
};
/**
 * Represents a SCRU128 ID generator and provides an interface to do more than
 * just generate a string representation.
 */
class Generator {
    constructor() {
        /** Timestamp at last generation. */
        this.tsLastGen = 0;
        /** Counter at last generation. */
        this.counter = 0;
        /** Timestamp at last renewal of perSecRandom. */
        this.tsLastSec = 0;
        /** Per-second random value at last generation. */
        this.perSecRandom = 0;
        /** Returns a `k`-bit (cryptographically strong) random unsigned integer. */
        this.getRandomBits = detectRng();
    }
    /** Generates a new SCRU128 ID object. */
    generate() {
        let tsNow = Date.now();
        // update timestamp and counter
        if (tsNow > this.tsLastGen) {
            this.tsLastGen = tsNow;
            this.counter = this.getRandomBits(28);
        }
        else if (++this.counter > MAX_COUNTER) {
            // wait a moment until clock goes forward when counter overflows
            let nTrials = 0;
            while (tsNow <= this.tsLastGen) {
                tsNow = Date.now();
                if (++nTrials > 1000000) {
                    console.warn("scru128: reset state as clock did not go forward");
                    this.tsLastSec = 0;
                    break;
                }
            }
            this.tsLastGen = tsNow;
            this.counter = this.getRandomBits(28);
        }
        // update perSecRandom
        if (this.tsLastGen - this.tsLastSec > 1000) {
            this.tsLastSec = this.tsLastGen;
            this.perSecRandom = this.getRandomBits(24);
        }
        return Scru128Id.fromFields(this.tsLastGen - TIMESTAMP_EPOCH, this.counter, this.perSecRandom, this.getRandomBits(32));
    }
}
/**
 * Represents a SCRU128 ID and provides converters to/from string and numbers.
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
     * @param timestamp - 44-bit millisecond timestamp field.
     * @param counter - 28-bit per-millisecond counter field.
     * @param perSecRandom - 24-bit per-second randomness field.
     * @param perGenRandom - 32-bit per-generation randomness field.
     */
    static fromFields(timestamp, counter, perSecRandom, perGenRandom) {
        return new Scru128Id(timestamp, counter, perSecRandom, perGenRandom);
    }
    /** Returns the 26-digit canonical string representation. */
    toString() {
        const h48 = this.timestamp * 0x10 + (this.counter >> 24);
        const m40 = (this.counter & 16777215) * 65536 + (this.perSecRandom >> 8);
        const l40 = (this.perSecRandom & 0xff) * 4294967296 + this.perGenRandom;
        return (("000000000" + h48.toString(32)).slice(-10) +
            ("0000000" + m40.toString(32)).slice(-8) +
            ("0000000" + l40.toString(32)).slice(-8)).toUpperCase();
    }
    /** Creates an object from a 26-digit string representation. */
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
}
const defaultGenerator = new Generator();
/**
 * Generates a new SCRU128 ID encoded in a string.
 *
 * @returns 26-digit canonical string representation.
 */
const scru128 = () => defaultGenerator.generate().toString();
exports.scru128 = scru128;
/**
 * Exported for unit testing purposes only.
 *
 * @internal
 */
exports._internal = { Scru128Id, detectRng };
