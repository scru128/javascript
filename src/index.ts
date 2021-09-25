/**
 * SCRU128: Sortable, Clock and Random number-based Unique identifier
 *
 * @license Apache-2.0
 * @copyright 2021 LiosK
 * @packageDocumentation
 */

import { randomFillSync } from "crypto";

/** Unix time in milliseconds as at 2020-01-01 00:00:00+00:00. */
const TIMESTAMP_EPOCH = 1577836800000; // Date.UTC(2020, 0)

/** Maximum value of 28-bit counter field. */
const MAX_COUNTER = 0xfff_ffff;

/** Returns a random uint generator based on available cryptographic RNG. */
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

/** Represents a SCRU128 ID generator. */
class Generator {
  /** Timestamp at last generation. */
  private tsLastGen = 0;

  /** Counter at last generation. */
  private counter = 0;

  /** Timestamp at last renewal of perSecRandom. */
  private tsLastSec = 0;

  /** Per-second random value at last generation. */
  private perSecRandom = 0;

  /** Returns a `k`-bit (cryptographically strong) random unsigned integer. */
  private getRandomUint = detectRng();

  /** Generates a new SCRU128 ID object. */
  generate(): Identifier {
    let tsNow = Date.now();

    // update timestamp and counter
    if (tsNow > this.tsLastGen) {
      this.tsLastGen = tsNow;
      this.counter = this.getRandomUint(28);
    } else if (++this.counter > MAX_COUNTER) {
      // wait a moment until clock goes forward when counter overflows
      let i = 0;
      while (tsNow <= this.tsLastGen) {
        tsNow = Date.now();
        if (++i > 1_000_000) {
          console.warn("scru128: reset state as clock did not go forward");
          this.tsLastSec = 0;
          break;
        }
      }

      this.tsLastGen = tsNow;
      this.counter = this.getRandomUint(28);
    }

    // update perSecRandom
    if (this.tsLastGen - this.tsLastSec > 1000) {
      this.tsLastSec = this.tsLastGen;
      this.perSecRandom = this.getRandomUint(16);
    }

    return new Identifier(
      this.tsLastGen - TIMESTAMP_EPOCH,
      this.counter,
      this.perSecRandom,
      this.getRandomUint(40)
    );
  }
}

/** Represents a SCRU128 ID. */
class Identifier {
  /**
   * @param timestamp - 44-bit timestamp.
   * @param counter - 28-bit counter.
   * @param perSecRandom - 16-bit per-second randomness.
   * @param perGenRandom - 40-bit per-generation randomness.
   */
  constructor(
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
      this.perSecRandom > 0xffff ||
      this.perGenRandom > 0xff_ffff_ffff
    ) {
      throw new RangeError("invalid field value");
    }
  }

  /** Returns the canonical textual representation. */
  toString(): string {
    const h48 = this.timestamp * 0x10 + (this.counter >> 24);
    const m40 = (this.counter & 0xff_ffff) * 0x1_0000 + this.perSecRandom;
    return (
      ("000000000" + h48.toString(32)).slice(-10) +
      ("0000000" + m40.toString(32)).slice(-8) +
      ("0000000" + this.perGenRandom.toString(32)).slice(-8)
    ).toUpperCase();
  }

  /** Parses textual representation to create an object. */
  static fromString(s: string): Identifier {
    const m = s.match(/^([0-7][0-9A-V]{9})([0-9A-V]{8})([0-9A-V]{8})$/i);
    if (m === null) {
      throw new SyntaxError("invalid string representation: " + s);
    }

    const h48 = parseInt(m[1], 32);
    const m40 = parseInt(m[2], 32);
    return new Identifier(
      Math.trunc(h48 / 0x10),
      (h48 % 0x10 << 24) | Math.trunc(m40 / 0x1_0000),
      m40 % 0x1_0000,
      parseInt(m[3], 32)
    );
  }
}

const defaultGenerator = new Generator();

/**
 * Generates a new SCRU128 ID.
 *
 * @returns Canonical representation consisting of 26 characters.
 */
export const scru128 = (): string => defaultGenerator.generate().toString();

/**
 * Exported for unit testing purposes only.
 *
 * @internal
 */
export const _internal = { Identifier, detectRng };
