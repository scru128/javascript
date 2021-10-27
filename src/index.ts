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

import { randomFillSync } from "crypto";

/** Unix time in milliseconds at 2020-01-01 00:00:00+00:00. */
export const TIMESTAMP_BIAS = 1577836800000; // Date.UTC(2020, 0)

/** Maximum value of 28-bit counter field. */
const MAX_COUNTER = 0xfff_ffff;

/** Leading zeros to polyfill padStart(n, "0") with slice(-n). */
const PAD_ZEROS = "0000000000000000";

/** Returns a random bit generator based on available cryptographic RNG. */
const detectRng = (): ((k: number) => number) => {
  if (typeof window !== "undefined" && window.crypto) {
    // Web Crypto API on browsers
    return (k: number) =>
      window.crypto
        .getRandomValues(new Uint16Array(Math.ceil(k / 16)))
        .reduce((acc, e) => acc * 0x1_0000 + e) %
      2 ** k; // Caution: the result overflows if k > 48
  } else if (randomFillSync) {
    // Node.js Crypto
    return (k: number) =>
      randomFillSync(new Uint16Array(Math.ceil(k / 16))).reduce(
        (acc, e) => acc * 0x1_0000 + e
      ) %
      2 ** k; // Caution: the result overflows if k > 48
  } else {
    console.warn(
      "scru128: fell back on Math.random() as no cryptographic RNG was detected"
    );
    return (k: number) =>
      k > 30
        ? Math.trunc(Math.random() * 2 ** (k - 30)) * 0x4000_0000 +
          Math.trunc(Math.random() * 0x4000_0000)
        : Math.trunc(Math.random() * 2 ** k);
  }
};

/**
 * Represents a SCRU128 ID generator and provides an interface to do more than
 * just generate a string representation.
 *
 * @example
 * ```javascript
 * import { Generator } from "scru128";
 *
 * const g = new Generator();
 * const x = g.generate();
 * console.log(x.toString());
 * console.log(BigInt(x.toHex()));
 * ```
 */
export class Generator {
  /** Timestamp at last generation. */
  private tsLastGen = 0;

  /** Counter at last generation. */
  private counter = 0;

  /** Timestamp at last renewal of perSecRandom. */
  private tsLastSec = 0;

  /** Per-second random value at last generation. */
  private perSecRandom = 0;

  /** Maximum number of checking `Date.now()` until clock goes forward. */
  private nClockCheckMax = 1_000_000;

  /** Returns a `k`-bit (cryptographically strong) random unsigned integer. */
  private getRandomBits = detectRng();

  /** Generates a new SCRU128 ID object. */
  generate(): Scru128Id {
    let tsNow = Date.now();

    // update timestamp and counter
    if (tsNow > this.tsLastGen) {
      this.tsLastGen = tsNow;
      this.counter = this.getRandomBits(28);
    } else if (++this.counter > MAX_COUNTER) {
      // wait a moment until clock goes forward when counter overflows
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
      this.counter = this.getRandomBits(28);
    }

    // update perSecRandom
    if (this.tsLastGen - this.tsLastSec > 1000) {
      this.tsLastSec = this.tsLastGen;
      this.perSecRandom = this.getRandomBits(24);
    }

    return Scru128Id.fromFields(
      this.tsLastGen - TIMESTAMP_BIAS,
      this.counter,
      this.perSecRandom,
      this.getRandomBits(32)
    );
  }
}

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
export class Scru128Id {
  /** Creates an object from field values. */
  private constructor(
    readonly timestamp: number,
    readonly counter: number,
    readonly perSecRandom: number,
    readonly perGenRandom: number
  ) {
    if (
      !Number.isInteger(this.timestamp) ||
      !Number.isInteger(this.counter) ||
      !Number.isInteger(this.perSecRandom) ||
      !Number.isInteger(this.perGenRandom) ||
      this.timestamp < 0 ||
      this.counter < 0 ||
      this.perSecRandom < 0 ||
      this.perGenRandom < 0 ||
      this.timestamp > 0xfff_ffff_ffff ||
      this.counter > MAX_COUNTER ||
      this.perSecRandom > 0xff_ffff ||
      this.perGenRandom > 0xffff_ffff
    ) {
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
   * @throws RangeError if any argument is out of the range of each field.
   * @category Conversion
   */
  static fromFields(
    timestamp: number,
    counter: number,
    perSecRandom: number,
    perGenRandom: number
  ): Scru128Id {
    return new Scru128Id(timestamp, counter, perSecRandom, perGenRandom);
  }

  /**
   * Creates an object from a 26-digit string representation.
   *
   * @throws SyntaxError if the argument is not a valid string representation.
   * @category Conversion
   */
  static fromString(value: string): Scru128Id {
    const m = value.match(/^([0-7][0-9A-V]{9})([0-9A-V]{8})([0-9A-V]{8})$/i);
    if (m === null) {
      throw new SyntaxError("invalid string representation: " + value);
    }

    const h48 = parseInt(m[1], 32);
    const m40 = parseInt(m[2], 32);
    const l40 = parseInt(m[3], 32);
    return new Scru128Id(
      Math.trunc(h48 / 0x10),
      (h48 % 0x10 << 24) | Math.trunc(m40 / 0x1_0000),
      (m40 % 0x1_0000 << 8) | Math.trunc(l40 / 0x1_0000_0000),
      l40 % 0x1_0000_0000
    );
  }

  /**
   * Returns the 26-digit canonical string representation.
   *
   * @category Conversion
   */
  toString(): string {
    const h48 = this.timestamp * 0x10 + (this.counter >> 24);
    const m40 =
      (this.counter & 0xff_ffff) * 0x1_0000 + (this.perSecRandom >> 8);
    const l40 = (this.perSecRandom & 0xff) * 0x1_0000_0000 + this.perGenRandom;
    return (
      (PAD_ZEROS + h48.toString(32)).slice(-10) +
      (PAD_ZEROS + m40.toString(32)).slice(-8) +
      (PAD_ZEROS + l40.toString(32)).slice(-8)
    ).toUpperCase();
  }

  /**
   * Creates an object from a 128-bit unsigned integer encoded in a hexadecimal
   * string.
   *
   * @throws SyntaxError if the argument is not a hexadecimal string encoding a
   * 128-bit unsigned integer.
   * @category Conversion
   */
  static fromHex(value: string): Scru128Id {
    const m = value.match(/^(?:0x)?0*(0|[1-9a-f][0-9a-f]*)$/i);
    if (m === null || m[1].length > 32) {
      throw new SyntaxError("invalid hexadecimal integer: " + value);
    }

    return new Scru128Id(
      parseInt(m[1].slice(-32, -21) || "0", 16),
      parseInt(m[1].slice(-21, -14) || "0", 16),
      parseInt(m[1].slice(-14, -8) || "0", 16),
      parseInt(m[1].slice(-8) || "0", 16)
    );
  }

  /**
   * Returns the 128-bit unsigned integer representation as a 32-digit
   * hexadecimal string prefixed with "0x".
   *
   * @category Conversion
   */
  toHex(): string {
    return (
      "0x" +
      (PAD_ZEROS + this.timestamp.toString(16)).slice(-11) +
      (PAD_ZEROS + this.counter.toString(16)).slice(-7) +
      (PAD_ZEROS + this.perSecRandom.toString(16)).slice(-6) +
      (PAD_ZEROS + this.perGenRandom.toString(16)).slice(-8)
    );
  }

  /** Represents `this` in JSON as a 26-digit canonical string. */
  toJSON(): string {
    return this.toString();
  }

  /** Creates an object from `this`. */
  clone(): Scru128Id {
    return new Scru128Id(
      this.timestamp,
      this.counter,
      this.perSecRandom,
      this.perGenRandom
    );
  }

  /** Returns true if `this` is equivalent to `other`. */
  equals(other: Scru128Id): boolean {
    return this.compareTo(other) === 0;
  }

  /**
   * Returns a negative integer, zero, and positive integer if `this` is less
   * than, equal to, and greater than `other`, respectively.
   */
  compareTo(other: Scru128Id): number {
    return Math.sign(
      this.timestamp - other.timestamp ||
        this.counter - other.counter ||
        this.perSecRandom - other.perSecRandom ||
        this.perGenRandom - other.perGenRandom
    );
  }
}

const defaultGenerator = new Generator();

/**
 * Generates a new SCRU128 ID encoded in a string.
 *
 * Use this function to quickly get a new SCRU128 ID as a string. Use
 * [[Generator]] to do more.
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
export const scru128 = (): string => defaultGenerator.generate().toString();

/**
 * Exported for unit testing purposes only.
 *
 * @internal
 */
export const _internal = { detectRng };
