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
export declare class Scru128Id {
    private readonly bytes;
    /** Creates an object from a 16-byte byte array. */
    private constructor();
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
    static fromFields(timestamp: number, counterHi: number, counterLo: number, entropy: number): Scru128Id;
    /** Returns the 48-bit `timestamp` field value. */
    get timestamp(): number;
    /** Returns the 24-bit `counter_hi` field value. */
    get counterHi(): number;
    /** Returns the 24-bit `counter_lo` field value. */
    get counterLo(): number;
    /** Returns the 32-bit `entropy` field value. */
    get entropy(): number;
    /**
     * Creates an object from a 25-digit string representation.
     *
     * @throws SyntaxError if the argument is not a valid string representation.
     * @category Conversion
     */
    static fromString(value: string): Scru128Id;
    /**
     * Returns the 25-digit canonical string representation.
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
     * @throws TypeError if the byte length of the argument is not 16.
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
    /** Represents `this` in JSON as a 25-digit canonical string. */
    toJSON(): string;
    /**
     * Creates an object from `this`.
     *
     * Note that this class is designed to be immutable, and thus `clone()` is not
     * necessary unless properties marked as private are modified directly.
     */
    clone(): Scru128Id;
    /** Returns true if `this` is equivalent to `other`. */
    equals(other: Scru128Id): boolean;
    /**
     * Returns a negative integer, zero, or positive integer if `this` is less
     * than, equal to, or greater than `other`, respectively.
     */
    compareTo(other: Scru128Id): number;
    /** Returns a part of `bytes` as an unsigned integer. */
    private subUint;
}
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
export declare class Scru128Generator {
    private timestamp;
    private counterHi;
    private counterLo;
    /** Timestamp at the last renewal of `counter_hi` field. */
    private tsCounterHi;
    /** Status code reported at the last generation. */
    private lastStatus;
    /** Random number generator used by the generator. */
    private rng;
    /**
     * Creates a generator object with the default random number generator, or
     * with the specified one if passed as an argument. The specified random
     * number generator should be cryptographically strong and securely seeded.
     */
    constructor(randomNumberGenerator?: {
        /** Returns a 32-bit random unsigned integer. */
        nextUint32: () => number;
    });
    /** Generates a new SCRU128 ID object. */
    generate(): Scru128Id;
    /**
     * Generates a new SCRU128 ID object with the `timestamp` passed.
     *
     * @throws RangeError if the argument is not a 48-bit positive integer.
     */
    generateCore(timestamp: number): Scru128Id;
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
    getLastStatus(): "NOT_EXECUTED" | "NEW_TIMESTAMP" | "COUNTER_LO_INC" | "COUNTER_HI_INC" | "TIMESTAMP_INC" | "CLOCK_ROLLBACK";
}
/** Generates a new SCRU128 ID object. */
export declare const scru128: () => Scru128Id;
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
export declare const scru128String: () => string;
