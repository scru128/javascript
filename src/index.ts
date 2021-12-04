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
 * @copyright 2021 LiosK
 * @packageDocumentation
 */

import { randomFillSync } from "crypto";

/** Unix time in milliseconds at 2020-01-01 00:00:00+00:00. */
export const TIMESTAMP_BIAS = 1577836800000; // Date.UTC(2020, 0)

/** Maximum value of 28-bit counter field. */
const MAX_COUNTER = 0xfff_ffff;

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

/** Returns a random number generator based on available cryptographic RNG. */
const detectRng = (): (() => number) => {
  if (typeof window !== "undefined" && window.crypto) {
    // Web Crypto API on browsers
    return () => window.crypto.getRandomValues(new Uint32Array(1))[0];
  } else if (randomFillSync) {
    // Node.js Crypto
    return () => randomFillSync(new Uint32Array(1))[0];
  } else {
    console.warn(
      "scru128: fell back on Math.random() as no cryptographic RNG was detected"
    );
    return () =>
      Math.trunc(Math.random() * 0x1_0000) * 0x1_0000 +
      Math.trunc(Math.random() * 0x1_0000);
  }
};

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
export class Scru128Generator {
  /** Timestamp at last generation. */
  private tsLastGen = 0;

  /** Counter at last generation. */
  private counter = 0;

  /** Timestamp at last renewal of perSecRandom. */
  private tsLastSec = 0;

  /** Per-second random value at last generation. */
  private perSecRandom = 0;

  /** Maximum number of checking the system clock until it goes forward. */
  private nClockCheckMax = 1_000_000;

  /** Returns a 32-bit (cryptographically strong) random unsigned integer. */
  private getRandomUint32 = detectRng();

  /** Generates a new SCRU128 ID object. */
  generate(): Scru128Id {
    // update timestamp and counter
    let tsNow = Date.now();
    if (tsNow > this.tsLastGen) {
      this.tsLastGen = tsNow;
      this.counter = this.getRandomUint32() >>> 4;
    } else if (++this.counter > MAX_COUNTER) {
      console.info(
        "scru128: counter limit reached; will wait until clock goes forward"
      );
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

    return Scru128Id.fromFields(
      this.tsLastGen - TIMESTAMP_BIAS,
      this.counter,
      this.perSecRandom,
      this.getRandomUint32()
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
 * console.log(String(x));
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
   * @param timestamp - 44-bit millisecond timestamp field value.
   * @param counter - 28-bit per-timestamp monotonic counter field value.
   * @param perSecRandom - 24-bit per-second randomness field value.
   * @param perGenRandom - 32-bit per-generation randomness field value.
   * @throws RangeError if any argument is out of the value range of the field.
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
    const hi8 = Math.trunc(this.timestamp / 0x10_0000_0000);
    const lo30s = [
      (this.timestamp / 0x40) & 0x3fff_ffff,
      (this.timestamp % 0x40 << 24) | (this.counter >>> 4),
      ((this.counter & 0xf) << 26) |
        (this.perSecRandom << 2) |
        (this.perGenRandom >>> 30),
      this.perGenRandom & 0x3fff_ffff,
    ];

    let buffer = "";
    for (let i = 0; i < 4; i++) {
      let n = lo30s[3 - i];
      for (let j = 0; j < 6; j++) {
        buffer = DIGITS.charAt(n & 31) + buffer;
        n >>>= 5;
      }
    }
    return DIGITS.charAt(hi8 >>> 5) + DIGITS.charAt(hi8 & 31) + buffer;
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
      ("000000000000" + this.timestamp.toString(16)).slice(-11) +
      ("000000000000" + this.counter.toString(16)).slice(-7) +
      ("000000000000" + this.perSecRandom.toString(16)).slice(-6) +
      ("000000000000" + this.perGenRandom.toString(16)).slice(-8)
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

const defaultGenerator = new Scru128Generator();

/** Generates a new SCRU128 ID object. */
export const scru128 = (): Scru128Id => defaultGenerator.generate();

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
export const scru128String = (): string => scru128().toString();
