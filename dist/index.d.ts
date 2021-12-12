/**
 * SCRU128: Sortable, Clock and Random number-based Unique identifier
 *
 * @example
 * ```javascript
 * import { scru128, scru128String } from "scru128";
 *
 * // generate a new identifier object
 * const x = scru128();
 * console.log(String(x)); // e.g. "00S6GVKR1MH58KE72EJD87SDOO"
 * console.log(BigInt(x.toHex())); // as a 128-bit unsigned integer
 *
 * // generate a textual representation directly
 * console.log(scru128String()); // e.g. "00S6GVKR3F7R79I72EJF0J4RGC"
 * ```
 *
 * @license Apache-2.0
 * @packageDocumentation
 */
/** Unix time in milliseconds at 2020-01-01 00:00:00+00:00. */
export declare const TIMESTAMP_BIAS = 1577836800000;
/**
 * Represents a SCRU128 ID and provides various converters and comparison
 * operators.
 *
 * @example
 * ```javascript
 * import { Scru128Id } from "scru128";
 *
 * const x = Scru128Id.fromString("00Q1D9AB6DTJNLJ80SJ42SNJ4F");
 * console.log(String(x));
 *
 * const y = Scru128Id.fromHex(0xd05a952ccdecef5aa01c9904e5a115n.toString(16));
 * console.log(BigInt(y.toHex()));
 * ```
 */
export declare class Scru128Id {
    readonly timestamp: number;
    readonly counter: number;
    readonly perSecRandom: number;
    readonly perGenRandom: number;
    /** Creates an object from field values. */
    private constructor();
    /**
     * Creates an object from field values.
     *
     * @param timestamp - 44-bit millisecond timestamp field value.
     * @param counter - 28-bit per-timestamp monotonic counter field value.
     * @param perSecRandom - 24-bit per-second randomness field value.
     * @param perGenRandom - 32-bit per-generation randomness field value.
     * @throws RangeError if any argument is out of the value range of the field.
     * @category Conversion
     */
    static fromFields(timestamp: number, counter: number, perSecRandom: number, perGenRandom: number): Scru128Id;
    /**
     * Creates an object from a 26-digit string representation.
     *
     * @throws SyntaxError if the argument is not a valid string representation.
     * @category Conversion
     */
    static fromString(value: string): Scru128Id;
    /**
     * Returns the 26-digit canonical string representation.
     *
     * @category Conversion
     */
    toString(): string;
    /**
     * Creates an object from a byte array that represents a 128-bit unsigned
     * integer.
     *
     * @param value - 16-byte buffer that represents a 128-bit unsigned integer in
     * the big-endian (network) byte order.
     * @throws RangeError if the byte length of the argument is not 16.
     * @category Conversion
     */
    static fromArrayBuffer(value: ArrayBuffer): Scru128Id;
    /**
     * Returns a 16-byte byte array containing the 128-bit unsigned integer
     * representation in the big-endian (network) byte order.
     *
     * @category Conversion
     */
    toArrayBuffer(): ArrayBuffer;
    /**
     * Creates an object from a 128-bit unsigned integer encoded in a hexadecimal
     * string.
     *
     * @throws SyntaxError if the argument is not a hexadecimal string encoding a
     * 128-bit unsigned integer.
     * @category Conversion
     */
    static fromHex(value: string): Scru128Id;
    /**
     * Returns the 128-bit unsigned integer representation as a 32-digit
     * hexadecimal string prefixed with "0x".
     *
     * @category Conversion
     */
    toHex(): string;
    /** Represents `this` in JSON as a 26-digit canonical string. */
    toJSON(): string;
    /** Creates an object from `this`. */
    clone(): Scru128Id;
    /** Returns true if `this` is equivalent to `other`. */
    equals(other: Scru128Id): boolean;
    /**
     * Returns a negative integer, zero, and positive integer if `this` is less
     * than, equal to, and greater than `other`, respectively.
     */
    compareTo(other: Scru128Id): number;
}
/**
 * Specifies the logger object used in the package.
 *
 * Logging is disabled by default. Set a logger object to enable logging. The
 * interface is compatible with the console object.
 */
export declare const setLogger: (newLogger: {
    error: (message: string) => void;
    warn: (message: string) => void;
    info: (message: string) => void;
}) => void;
/**
 * Represents a SCRU128 ID generator that encapsulates the monotonic counter and
 * other internal states.
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
export declare class Scru128Generator {
    /** Timestamp at last generation. */
    private tsLastGen;
    /** Counter at last generation. */
    private counter;
    /** Timestamp at last renewal of perSecRandom. */
    private tsLastSec;
    /** Per-second random value at last generation. */
    private perSecRandom;
    /** Maximum number of checking the system clock until it goes forward. */
    private nClockCheckMax;
    /** Returns a 32-bit (cryptographically strong) random unsigned integer. */
    private getRandomUint32;
    /** Generates a new SCRU128 ID object. */
    generate(): Scru128Id;
}
/** Generates a new SCRU128 ID object. */
export declare const scru128: () => Scru128Id;
/**
 * Generates a new SCRU128 ID encoded in a string.
 *
 * Use this function to quickly get a new SCRU128 ID as a string.
 *
 * @returns 26-digit canonical string representation.
 * @example
 * ```javascript
 * import { scru128String } from "scru128";
 *
 * const x = scru128String();
 * console.log(x);
 * ```
 */
export declare const scru128String: () => string;
