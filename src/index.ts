/**
 * SCRU128: Sortable, Clock and Random number-based Unique identifier
 *
 * @example
 * ```javascript
 * import { scru128, scru128String } from "scru128";
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

import { randomFillSync } from "crypto";

/** Maximum value of 24-bit `counter_hi` field. */
const MAX_COUNTER_HI = 0xff_ffff;

/** Maximum value of 24-bit `counter_lo` field. */
const MAX_COUNTER_LO = 0xff_ffff;

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
export class Scru128Id {
  /** Creates an object from four 32-bit words. */
  private constructor(private readonly words: Uint32Array) {
    if (words.length !== 4) {
      throw new TypeError("invalid number of words: " + words.length);
    }
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
  static fromFields(
    timestamp: number,
    counterHi: number,
    counterLo: number,
    entropy: number
  ): Scru128Id {
    if (
      !Number.isInteger(timestamp) ||
      !Number.isInteger(counterHi) ||
      !Number.isInteger(counterLo) ||
      !Number.isInteger(entropy) ||
      timestamp < 0 ||
      counterHi < 0 ||
      counterLo < 0 ||
      entropy < 0 ||
      timestamp > 0xffff_ffff_ffff ||
      counterHi > MAX_COUNTER_HI ||
      counterLo > MAX_COUNTER_LO ||
      entropy > 0xffff_ffff
    ) {
      throw new RangeError("invalid field value");
    }

    const words = new Uint32Array(4);
    words[0] = Math.trunc(timestamp / 0x1_0000);
    words[1] = (timestamp & 0xffff) * 0x1_0000 + (counterHi >>> 8);
    words[2] = (counterHi & 0xff) * 0x100_0000 + counterLo;
    words[3] = entropy;
    return new Scru128Id(words);
  }

  /** Returns the 48-bit `timestamp` field value. */
  get timestamp(): number {
    return this.words[0] * 0x1_0000 + (this.words[1] >>> 16);
  }

  /** Returns the 24-bit `counter_hi` field value. */
  get counterHi(): number {
    return (this.words[1] * 0x100 + (this.words[2] >>> 24)) & MAX_COUNTER_HI;
  }

  /** Returns the 24-bit `counter_lo` field value. */
  get counterLo(): number {
    return this.words[2] & MAX_COUNTER_LO;
  }

  /** Returns the 32-bit `entropy` field value. */
  get entropy(): number {
    return this.words[3];
  }

  /**
   * Creates an object from a 25-digit string representation.
   *
   * @throws SyntaxError if the argument is not a valid string representation.
   * @category Conversion
   */
  static fromString(value: string): Scru128Id {
    if (value.length !== 25) {
      throw new SyntaxError("invalid length: " + value.length);
    }

    const src = new Uint8Array(25);
    for (let i = 0; i < 25; i++) {
      src[i] = DECODE_MAP[value.charCodeAt(i)] ?? 0x7f;
      if (src[i] === 0x7f) {
        throw new SyntaxError("invalid digit: " + value.charAt(i));
      }
    }

    const dst = new Uint32Array(4);
    let minIndex = 99; // any number greater than size of output array
    for (let carry of src) {
      // iterate over output array from right to left while carry != 0 but at
      // least up to place already filled
      let i = dst.length - 1;
      for (; carry > 0 || i > minIndex; i--) {
        if (i < 0) {
          throw new SyntaxError("out of 128-bit value range");
        }
        carry += dst[i] * 36;
        const quo = Math.trunc(carry / 0x1_0000_0000);
        dst[i] = carry - quo * 0x1_0000_0000; // remainder
        carry = quo;
      }
      minIndex = i;
    }

    return new Scru128Id(dst);
  }

  /**
   * Returns the 25-digit canonical string representation.
   *
   * @category Conversion
   */
  toString(): string {
    const dst = new Uint8Array(25);
    let minIndex = 99; // any number greater than size of output array
    for (let carry of this.words) {
      // iterate over output array from right to left while carry != 0 but at
      // least up to place already filled
      let i = dst.length - 1;
      for (; carry > 0 || i > minIndex; i--) {
        // console.assert(i >= 0);
        carry += dst[i] * 0x1_0000_0000;
        const quo = Math.trunc(carry / 36);
        dst[i] = carry - quo * 36; // remainder
        carry = quo;
      }
      minIndex = i;
    }

    let text = "";
    for (let d of dst) {
      text += DIGITS[d];
    }
    return text;
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

    const src = new DataView(value);
    const dst = new Uint32Array(4);
    for (let i = 0; i < 4; i++) {
      dst[i] = src.getUint32(i * 4);
    }
    return new Scru128Id(dst);
  }

  /**
   * Returns a 16-byte byte array containing the 128-bit unsigned integer
   * representation in the big-endian (network) byte order.
   *
   * @category Conversion
   */
  toArrayBuffer(): ArrayBuffer {
    const dst = new DataView(new ArrayBuffer(16));
    for (let i = 0; i < 4; i++) {
      dst.setUint32(i * 4, this.words[i]);
    }
    return dst.buffer;
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
      throw new SyntaxError("invalid hexadecimal integer");
    }

    const words = new Uint32Array(4);
    words[0] = parseInt(m[1].slice(-32, -24) || "0", 16);
    words[1] = parseInt(m[1].slice(-24, -16) || "0", 16);
    words[2] = parseInt(m[1].slice(-16, -8) || "0", 16);
    words[3] = parseInt(m[1].slice(-8) || "0", 16);
    return new Scru128Id(words);
  }

  /**
   * Returns the 128-bit unsigned integer representation as a 32-digit
   * hexadecimal string prefixed with "0x".
   *
   * @category Conversion
   */
  toHex(): string {
    let text = "0x";
    for (let e of this.words) {
      text += ("0000000" + e.toString(16)).slice(-8);
    }
    return text;
  }

  /** Represents `this` in JSON as a 25-digit canonical string. */
  toJSON(): string {
    return this.toString();
  }

  /** Creates an object from `this`. */
  clone(): Scru128Id {
    return new Scru128Id(this.words.slice(0));
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
    for (let i = 0; i < 4; i++) {
      const diff = this.words[i] - other.words[i];
      if (diff !== 0) {
        return Math.sign(diff);
      }
    }
    return 0;
  }
}

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
    return () =>
      Math.trunc(Math.random() * 0x1_0000) * 0x1_0000 +
      Math.trunc(Math.random() * 0x1_0000);
  }
};

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
export class Scru128Generator {
  private timestamp = 0;
  private counterHi = 0;
  private counterLo = 0;

  /** Timestamp at the last renewal of `counter_hi` field. */
  private tsCounterHi = 0;

  /** Random number generator used by the generator. */
  private rng: { nextUint32: () => number };

  /** Logger object used by the generator. */
  private logger = { warn: (message: string): void => {} };

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
    const ts = Date.now();
    if (ts > this.timestamp) {
      this.timestamp = ts;
      this.counterLo = this.rng.nextUint32() & MAX_COUNTER_LO;
      if (ts - this.tsCounterHi >= 1000) {
        this.tsCounterHi = ts;
        this.counterHi = this.rng.nextUint32() & MAX_COUNTER_HI;
      }
    } else {
      this.counterLo++;
      if (this.counterLo > MAX_COUNTER_LO) {
        this.counterLo = 0;
        this.counterHi++;
        if (this.counterHi > MAX_COUNTER_HI) {
          this.counterHi = 0;
          this.handleCounterOverflow();
          return this.generate();
        }
      }
    }

    return Scru128Id.fromFields(
      this.timestamp,
      this.counterHi,
      this.counterLo,
      this.rng.nextUint32()
    );
  }

  /**
   * Defines the behavior on counter overflow.
   *
   * Currently, this method busy-waits for the next clock tick and, if the clock
   * does not move forward for a while, reinitializes the generator state.
   */
  private handleCounterOverflow(): void {
    this.logger.warn("counter overflowing; will wait for next clock tick");
    this.tsCounterHi = 0;
    for (let i = 0; i < 1_000_000; i++) {
      if (Date.now() > this.timestamp) {
        return;
      }
    }
    this.logger.warn("reset state as clock did not move for a while");
    this.timestamp = 0;
  }

  /**
   * Specifies the logger object used by the generator.
   *
   * Logging is disabled by default. Set a logger object to enable logging. The
   * interface is compatible with the console object.
   */
  setLogger(logger: { warn: (message: string) => void }): this {
    this.logger = logger;
    return this;
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
 * @returns 25-digit canonical string representation.
 * @example
 * ```javascript
 * import { scru128String } from "scru128";
 *
 * const x = scru128String();
 * console.log(x);
 * ```
 */
export const scru128String = (): string => scru128().toString();
