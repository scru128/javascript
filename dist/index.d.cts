/**
 * SCRU128: Sortable, Clock and Random number-based Unique identifier
 *
 * @example
 * ```javascript
 * import { scru128, scru128String } from "scru128";
 * // or on browsers:
 * // import { scru128, scru128String } from "https://unpkg.com/scru128@^3";
 *
 * // generate a new identifier object
 * const x = scru128();
 * console.log(String(x)); // e.g., "036z951mhjikzik2gsl81gr7l"
 * console.log(x.toBigInt()); // as a 128-bit unsigned integer
 *
 * // generate a textual representation directly
 * console.log(scru128String()); // e.g., "036z951mhzx67t63mq9xe6q0j"
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
 * const x = Scru128Id.fromString("036z968fu2tugy7svkfznewkk");
 * console.log(String(x));
 *
 * const y = Scru128Id.fromBigInt(0x017fa1de51a80fd992f9e8cc2d5eb88en);
 * console.log(y.toBigInt());
 * ```
 */
export declare class Scru128Id {
    /**
     * A 16-byte byte array containing the 128-bit unsigned integer representation
     * in the big-endian (network) byte order.
     */
    readonly bytes: Readonly<Uint8Array>;
    /** Creates an object from a 16-byte byte array. */
    private constructor();
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
    static ofInner(bytes: Uint8Array): Scru128Id;
    /**
     * Creates an object from field values.
     *
     * @param timestamp - A 48-bit `timestamp` field value.
     * @param counterHi - A 24-bit `counter_hi` field value.
     * @param counterLo - A 24-bit `counter_lo` field value.
     * @param entropy - A 32-bit `entropy` field value.
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
     * Creates an object from an array of Base36 digit values representing a
     * 25-digit string representation.
     *
     * @throws SyntaxError if the argument does not contain a valid string
     * representation.
     * @category Conversion
     */
    private static fromDigitValues;
    /**
     * Returns the 25-digit canonical string representation.
     *
     * @category Conversion
     */
    toString(): string;
    /**
     * Creates an object from a byte array representing either a 128-bit unsigned
     * integer or a 25-digit Base36 string.
     *
     * This method shallow-copies the content of the argument, so the created
     * object holds another instance of the byte array.
     *
     * @param value - An array of 16 bytes that contains a 128-bit unsigned
     * integer in the big-endian (network) byte order or an array of 25 ASCII code
     * points that reads a 25-digit Base36 string.
     * @throws SyntaxError if conversion fails.
     * @category Conversion
     */
    static fromBytes(value: ArrayLike<number>): Scru128Id;
    /**
     * Creates an object from a 128-bit unsigned integer.
     *
     * @throws RangeError if the argument is out of the range of 128-bit unsigned
     * integer.
     * @category Conversion
     */
    static fromBigInt(value: bigint): Scru128Id;
    /**
     * Returns the 128-bit unsigned integer representation.
     *
     * @category Conversion
     */
    toBigInt(): bigint;
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
 * console.log(x.toBigInt());
 * ```
 *
 * @remarks
 * The generator comes with four different methods that generate a SCRU128 ID:
 *
 * | Flavor                      | Timestamp | On big clock rewind |
 * | --------------------------- | --------- | ------------------- |
 * | {@link generate}            | Now       | Resets generator    |
 * | {@link generateOrAbort}     | Now       | Returns `undefined` |
 * | {@link generateOrResetCore} | Argument  | Resets generator    |
 * | {@link generateOrAbortCore} | Argument  | Returns `undefined` |
 *
 * All of the four return a monotonically increasing ID by reusing the previous
 * `timestamp` even if the one provided is smaller than the immediately
 * preceding ID's. However, when such a clock rollback is considered significant
 * (by default, more than ten seconds):
 *
 * 1. `generate` (OrReset) methods reset the generator and return a new ID based
 *    on the given `timestamp`, breaking the increasing order of IDs.
 * 2. `OrAbort` variants abort and return `undefined` immediately.
 *
 * The `Core` functions offer low-level primitives to customize the behavior.
 */
export declare class Scru128Generator {
    private timestamp;
    private counterHi;
    private counterLo;
    /** The timestamp at the last renewal of `counter_hi` field. */
    private tsCounterHi;
    /** The random number generator used by the generator. */
    private rng;
    /**
     * Creates a generator object with the default random number generator, or
     * with the specified one if passed as an argument. The specified random
     * number generator should be cryptographically strong and securely seeded.
     */
    constructor(randomNumberGenerator?: {
        /** Returns a 32-bit random unsigned integer. */
        nextUint32(): number;
    });
    /**
     * Generates a new SCRU128 ID object from the current `timestamp`, or resets
     * the generator upon significant timestamp rollback.
     *
     * See the {@link Scru128Generator} class documentation for the description.
     */
    generate(): Scru128Id;
    /**
     * Generates a new SCRU128 ID object from the current `timestamp`, or returns
     * `undefined` upon significant timestamp rollback.
     *
     * See the {@link Scru128Generator} class documentation for the description.
     *
     * @example
     * ```javascript
     * import { Scru128Generator } from "scru128";
     *
     * const g = new Scru128Generator();
     * const x = g.generateOrAbort();
     * const y = g.generateOrAbort();
     * if (y === undefined) {
     *   throw new Error("The clock went backwards by ten seconds!");
     * }
     * console.assert(x.compareTo(y) < 0);
     * ```
     */
    generateOrAbort(): Scru128Id | undefined;
    /**
     * Generates a new SCRU128 ID object from the `timestamp` passed, or resets
     * the generator upon significant timestamp rollback.
     *
     * See the {@link Scru128Generator} class documentation for the description.
     *
     * @param rollbackAllowance - The amount of `timestamp` rollback that is
     * considered significant. A suggested value is `10_000` (milliseconds).
     * @throws RangeError if `timestamp` is not a 48-bit positive integer.
     */
    generateOrResetCore(timestamp: number, rollbackAllowance: number): Scru128Id;
    /**
     * Generates a new SCRU128 ID object from the `timestamp` passed, or returns
     * `undefined` upon significant timestamp rollback.
     *
     * See the {@link Scru128Generator} class documentation for the description.
     *
     * @param rollbackAllowance - The amount of `timestamp` rollback that is
     * considered significant. A suggested value is `10_000` (milliseconds).
     * @throws RangeError if `timestamp` is not a 48-bit positive integer.
     */
    generateOrAbortCore(timestamp: number, rollbackAllowance: number): Scru128Id | undefined;
    /**
     * Returns an infinite iterator object that produces a new ID for each call of
     * `next()`.
     *
     * @example
     * ```javascript
     * import { Scru128Generator } from "scru128";
     *
     * const [a, b, c] = new Scru128Generator();
     * console.log(String(a)); // e.g., "038mqr9e14cjc12dh9amw7i5o"
     * console.log(String(b)); // e.g., "038mqr9e14cjc12dh9dtpwfr3"
     * console.log(String(c)); // e.g., "038mqr9e14cjc12dh9e6rjmqi"
     * ```
     */
    [Symbol.iterator](): Iterator<Scru128Id, undefined>;
    /**
     * Returns a new SCRU128 ID object for each call, infinitely.
     *
     * This method wraps the result of {@link generate} in an [`IteratorResult`]
     * object to use `this` as an infinite iterator.
     *
     * [`IteratorResult`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Iteration_protocols
     */
    next(): IteratorResult<Scru128Id, undefined>;
}
/** Generates a new SCRU128 ID object using the global generator. */
export declare const scru128: () => Scru128Id;
/**
 * Generates a new SCRU128 ID encoded in a string using the global generator.
 *
 * Use this function to quickly get a new SCRU128 ID as a string.
 *
 * @returns The 25-digit canonical string representation.
 * @example
 * ```javascript
 * import { scru128String } from "scru128";
 *
 * const x = scru128String();
 * console.log(x);
 * ```
 */
export declare const scru128String: () => string;
