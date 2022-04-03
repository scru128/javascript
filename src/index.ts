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
  /** Creates an object from a 16-byte byte array. */
  private constructor(private readonly bytes: Uint8Array) {
    if (bytes.length !== 16) {
      throw new TypeError("invalid length of byte array: " + bytes.length);
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

    const bytes = new Uint8Array(16);
    bytes[0] = timestamp / 0x100_0000_0000;
    bytes[1] = timestamp / 0x1_0000_0000;
    bytes[2] = timestamp >>> 24;
    bytes[3] = timestamp >>> 16;
    bytes[4] = timestamp >>> 8;
    bytes[5] = timestamp;
    bytes[6] = counterHi >>> 16;
    bytes[7] = counterHi >>> 8;
    bytes[8] = counterHi;
    bytes[9] = counterLo >>> 16;
    bytes[10] = counterLo >>> 8;
    bytes[11] = counterLo;
    bytes[12] = entropy >>> 24;
    bytes[13] = entropy >>> 16;
    bytes[14] = entropy >>> 8;
    bytes[15] = entropy;
    return new Scru128Id(bytes);
  }

  /** Returns the 48-bit `timestamp` field value. */
  get timestamp(): number {
    return this.subUint(0, 6);
  }

  /** Returns the 24-bit `counter_hi` field value. */
  get counterHi(): number {
    return this.subUint(6, 9);
  }

  /** Returns the 24-bit `counter_lo` field value. */
  get counterLo(): number {
    return this.subUint(9, 12);
  }

  /** Returns the 32-bit `entropy` field value. */
  get entropy(): number {
    return this.subUint(12, 16);
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

    const dst = new Uint8Array(16);
    let minIndex = 99; // any number greater than size of output array
    for (let i = -7; i < 25; i += 8) {
      // implement Base36 using 8-digit words
      let carry = 0;
      for (let j = i < 0 ? 0 : i; j < i + 8; j++) {
        carry = carry * 36 + src[j];
      }

      // iterate over output array from right to left while carry != 0 but at
      // least up to place already filled
      let j = dst.length - 1;
      for (; carry > 0 || j > minIndex; j--) {
        if (j < 0) {
          throw new SyntaxError("out of 128-bit value range");
        }
        carry += dst[j] * 2821109907456; // 36 ** 8
        const quo = Math.trunc(carry / 0x100);
        dst[j] = carry & 0xff; // remainder
        carry = quo;
      }
      minIndex = j;
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
    for (let i = -4; i < 16; i += 5) {
      // implement Base36 using 40-bit words
      let carry = this.subUint(i < 0 ? 0 : i, i + 5);

      // iterate over output array from right to left while carry != 0 but at
      // least up to place already filled
      let j = dst.length - 1;
      for (; carry > 0 || j > minIndex; j--) {
        // console.assert(j >= 0);
        carry += dst[j] * 0x100_0000_0000;
        const quo = Math.trunc(carry / 36);
        dst[j] = carry - quo * 36; // remainder
        carry = quo;
      }
      minIndex = j;
    }

    let text = "";
    for (let d of dst) {
      text += DIGITS.charAt(d);
    }
    return text;
  }

  /**
   * Creates an object from a byte array that represents a 128-bit unsigned
   * integer.
   *
   * @param value - 16-byte buffer that represents a 128-bit unsigned integer in
   * the big-endian (network) byte order.
   * @throws TypeError if the byte length of the argument is not 16.
   * @category Conversion
   */
  static fromArrayBuffer(value: ArrayBuffer): Scru128Id {
    if (value.byteLength !== 16) {
      throw new TypeError("invalid length of byte array: " + value.byteLength);
    }

    return new Scru128Id(new Uint8Array(value.slice(0)));
  }

  /**
   * Returns a 16-byte byte array containing the 128-bit unsigned integer
   * representation in the big-endian (network) byte order.
   *
   * @category Conversion
   */
  toArrayBuffer(): ArrayBuffer {
    return this.bytes.buffer.slice(0);
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

    const gap = 32 - m[1].length;
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      const pos = i * 2 - gap;
      bytes[i] =
        (pos < 0 ? 0 : DECODE_MAP[m[1].charCodeAt(pos)] << 4) |
        (pos + 1 < 0 ? 0 : DECODE_MAP[m[1].charCodeAt(pos + 1)]);
    }
    return new Scru128Id(bytes);
  }

  /**
   * Returns the 128-bit unsigned integer representation as a 32-digit
   * hexadecimal string prefixed with "0x".
   *
   * @category Conversion
   */
  toHex(): string {
    const digits = "0123456789abcdef";
    let text = "0x";
    for (let e of this.bytes) {
      text += digits.charAt(e >>> 4);
      text += digits.charAt(e & 0xf);
    }
    return text;
  }

  /** Represents `this` in JSON as a 25-digit canonical string. */
  toJSON(): string {
    return this.toString();
  }

  /**
   * Creates an object from `this`.
   *
   * Note that this class is designed to be immutable, and thus `clone()` is not
   * necessary unless properties marked as private are modified directly.
   */
  clone(): Scru128Id {
    return new Scru128Id(this.bytes.slice(0));
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
    for (let i = 0; i < 16; i++) {
      const diff = this.bytes[i] - other.bytes[i];
      if (diff !== 0) {
        return Math.sign(diff);
      }
    }
    return 0;
  }

  /** Returns a part of `bytes` as an unsigned integer. */
  private subUint(beginIndex: number, endIndex: number): number {
    let buffer = 0;
    while (beginIndex < endIndex) {
      buffer = buffer * 0x100 + this.bytes[beginIndex++];
    }
    return buffer;
  }
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
    this.rng = randomNumberGenerator || new DefaultRandom();
  }

  /** Generates a new SCRU128 ID object. */
  generate(): Scru128Id {
    while (true) {
      try {
        return this.generateCore();
      } catch (e) {
        if (e instanceof CounterOverflowError) {
          this.handleCounterOverflow();
        } else {
          throw e;
        }
      }
    }
  }

  /**
   * Generates a new SCRU128 ID object, while delegating the caller to take care
   * of counter overflows.
   *
   * @throws CounterOverflowError when the `counter_hi` and `counter_lo` fields
   * can no more be incremented.
   */
  private generateCore(): Scru128Id {
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
          throw new CounterOverflowError();
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

/** A global flag to force use of cryptographically strong RNG. */
declare const SCRU128_DENY_WEAK_RNG: boolean;

/** Stores `crypto.getRandomValues()` available in the environment. */
let getRandomValues: (buffer: Uint32Array) => Uint32Array = (buffer) => {
  // fall back on Math.random() unless the flag is set to true
  if (typeof SCRU128_DENY_WEAK_RNG !== "undefined" && SCRU128_DENY_WEAK_RNG) {
    throw new Error("no cryptographically strong RNG available");
  }

  for (let i = 0; i < buffer.length; i++) {
    buffer[i] =
      Math.trunc(Math.random() * 0x1_0000) * 0x1_0000 +
      Math.trunc(Math.random() * 0x1_0000);
  }
  return buffer;
};

// detect Web Crypto API
if (typeof crypto !== "undefined" && crypto.getRandomValues) {
  getRandomValues = (buffer) => crypto.getRandomValues(buffer);
}

/** @internal */
export const _setRandom = (
  rand: <T extends Uint8Array | Uint16Array | Uint32Array>(buffer: T) => T
) => {
  getRandomValues = rand;
};

/**
 * Wraps `crypto.getRandomValues()` and compatibles to enable buffering; this
 * uses a small buffer by default to avoid unbearable throughput decline in some
 * environments as well as the waste of time and space for unused values.
 */
class DefaultRandom {
  private readonly buffer = new Uint32Array(8);
  private cursor = Infinity;
  nextUint32(): number {
    if (this.cursor >= this.buffer.length) {
      getRandomValues(this.buffer);
      this.cursor = 0;
    }
    return this.buffer[this.cursor++];
  }
}

/** Error thrown when the monotonic counters can no more be incremented. */
class CounterOverflowError {}

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
