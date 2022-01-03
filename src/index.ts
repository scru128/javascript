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
 * @packageDocumentation
 */

import { randomFillSync } from "crypto";

/** Unix time in milliseconds at 2020-01-01 00:00:00+00:00. */
export const TIMESTAMP_BIAS = 1577836800000; // Date.UTC(2020, 0)

/** Maximum value of 28-bit counter field. */
const MAX_COUNTER = 0xfff_ffff;

/** Maximum value of 24-bit per_sec_random field. */
const MAX_PER_SEC_RANDOM = 0xff_ffff;

/** Digit characters used in the base 32 notation. */
const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUV";

/** O(1) map from ASCII code points to base 32 digit values. */
const DECODE_MAP = [
  0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
  0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
  0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
  0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x00, 0x01, 0x02, 0x03,
  0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
  0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
  0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x7f, 0x7f, 0x7f, 0x7f,
  0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
  0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
  0x1e, 0x1f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
];

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
      this.perSecRandom > MAX_PER_SEC_RANDOM ||
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
    if (value.length !== 26) {
      throw new SyntaxError("invalid string representation");
    }

    const n0 = DECODE_MAP[value.charCodeAt(0)] ?? 0x7f;
    const n1 = DECODE_MAP[value.charCodeAt(1)] ?? 0x7f;
    if (n0 > 7 || n1 === 0x7f) {
      throw new SyntaxError("invalid string representation");
    }

    const hi8 = (n0 << 5) | n1;
    const lo30s = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 6; j++) {
        const n = DECODE_MAP[value.charCodeAt(2 + i * 6 + j)] ?? 0x7f;
        if (n === 0x7f) {
          throw new SyntaxError("invalid string representation");
        }
        lo30s[i] = (lo30s[i] << 5) | n;
      }
    }

    return new Scru128Id(
      hi8 * 0x10_0000_0000 + lo30s[0] * 0x40 + (lo30s[1] >>> 24),
      ((lo30s[1] & 0xff_ffff) << 4) | (lo30s[2] >>> 26),
      (lo30s[2] >>> 2) & MAX_PER_SEC_RANDOM,
      (lo30s[2] & 0b11) * 0x4000_0000 + lo30s[3]
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
   * Creates an object from a byte array that represents a 128-bit unsigned
   * integer.
   *
   * @param value - 16-byte buffer that represents a 128-bit unsigned integer in
   * the big-endian (network) byte order.
   * @throws RangeError if the byte length of the argument is not 16.
   * @category Conversion
   */
  static fromArrayBuffer(value: ArrayBuffer): Scru128Id {
    if (value.byteLength !== 16) {
      throw new RangeError("not a 128-bit byte array");
    }

    const view = new DataView(value);
    return new Scru128Id(
      view.getUint32(0) * 0x1000 + (view.getUint16(4) >>> 4),
      view.getUint32(5) & MAX_COUNTER,
      view.getUint32(8) & MAX_PER_SEC_RANDOM,
      view.getUint32(12)
    );
  }

  /**
   * Returns a 16-byte byte array containing the 128-bit unsigned integer
   * representation in the big-endian (network) byte order.
   *
   * @category Conversion
   */
  toArrayBuffer(): ArrayBuffer {
    const view = new DataView(new ArrayBuffer(16));
    view.setUint32(12, this.perGenRandom);
    view.setUint32(8, this.perSecRandom);
    view.setUint32(5, this.counter);
    view.setUint16(4, (this.timestamp % 0x1000 << 4) | (this.counter >>> 24));
    view.setUint32(0, this.timestamp / 0x1000);
    return view.buffer;
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
   * Returns a negative integer, zero, or positive integer if `this` is less
   * than, equal to, or greater than `other`, respectively.
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

/** Logger object used in the package. */
let logger:
  | {
      error: (message: string) => void;
      warn: (message: string) => void;
      info: (message: string) => void;
    }
  | undefined = undefined;

/**
 * Specifies the logger object used in the package.
 *
 * Logging is disabled by default. Set a logger object to enable logging. The
 * interface is compatible with the console object.
 */
export const setLogger = (newLogger: {
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}): void => {
  logger = newLogger;
};

/** Returns a random number generator based on available cryptographic RNG. */
const detectRng = (): (() => number) => {
  // use small buffer to improve throughput while avoiding waste of time and
  // space for unused buffer contents
  const BUFFER_SIZE = 8;

  if (typeof window !== "undefined" && window.crypto) {
    // Web Crypto API on browsers
    const buffer = new Uint32Array(BUFFER_SIZE);
    let cursor = BUFFER_SIZE;
    return () => {
      if (cursor >= BUFFER_SIZE) {
        window.crypto.getRandomValues(buffer);
        cursor = 0;
      }
      return buffer[cursor++];
    };
  } else if (randomFillSync) {
    // Node.js Crypto
    const buffer = new Uint32Array(BUFFER_SIZE);
    let cursor = BUFFER_SIZE;
    return () => {
      if (cursor >= BUFFER_SIZE) {
        randomFillSync(buffer);
        cursor = 0;
      }
      return buffer[cursor++];
    };
  } else {
    logger?.warn(
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

  private rng: { nextUint32: () => number };

  /**
   * Creates a generator object with the default random number generator, or
   * with the specified one if passed as an argument. The specified random
   * number generator should be cryptographically strong and securely seeded.
   */
  constructor(randomNumberGenerator?: {
    /** Returns a 32-bit random unsigned integer. */
    nextUint32: () => number;
  }) {
    this.rng = randomNumberGenerator || { nextUint32: detectRng() };
  }

  /** Generates a new SCRU128 ID object. */
  generate(): Scru128Id {
    // update timestamp and counter
    let tsNow = Date.now();
    if (tsNow > this.tsLastGen) {
      this.tsLastGen = tsNow;
      this.counter = this.rng.nextUint32() >>> 4;
    } else if (++this.counter > MAX_COUNTER) {
      logger?.info(
        "scru128: counter limit reached; will wait until clock goes forward"
      );
      let nClockCheck = 0;
      while (tsNow <= this.tsLastGen) {
        tsNow = Date.now();
        if (++nClockCheck > this.nClockCheckMax) {
          logger?.warn("scru128: reset state as clock did not go forward");
          this.tsLastSec = 0;
          break;
        }
      }

      this.tsLastGen = tsNow;
      this.counter = this.rng.nextUint32() >>> 4;
    }

    // update perSecRandom
    if (this.tsLastGen - this.tsLastSec > 1000) {
      this.tsLastSec = this.tsLastGen;
      this.perSecRandom = this.rng.nextUint32() >>> 8;
    }

    return Scru128Id.fromFields(
      this.tsLastGen - TIMESTAMP_BIAS,
      this.counter,
      this.perSecRandom,
      this.rng.nextUint32()
    );
  }
}

let defaultGenerator: Scru128Generator | undefined;

/** Generates a new SCRU128 ID object. */
export const scru128 = (): Scru128Id =>
  (defaultGenerator || (defaultGenerator = new Scru128Generator())).generate();

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
