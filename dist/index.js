var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var MAX_TIMESTAMP = 281474976710655;
var MAX_COUNTER_HI = 16777215;
var MAX_COUNTER_LO = 16777215;
var DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
var DECODE_MAP = [
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  127,
  127,
  127,
  127,
  127,
  127,
  127,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  127,
  127,
  127,
  127,
  127,
  127,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  127,
  127,
  127,
  127,
  127
];
var DEFAULT_ROLLBACK_ALLOWANCE = 1e4;
var _Scru128Id = class _Scru128Id {
  /** Creates an object from a 16-byte byte array. */
  constructor(bytes) {
    this.bytes = bytes;
  }
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
  static ofInner(bytes) {
    if (bytes.length === 16) {
      return new _Scru128Id(bytes);
    } else {
      throw new TypeError(
        "invalid length of byte array: " + bytes.length + " bytes (expected 16)"
      );
    }
  }
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
  static fromFields(timestamp, counterHi, counterLo, entropy) {
    if (!Number.isInteger(timestamp) || !Number.isInteger(counterHi) || !Number.isInteger(counterLo) || !Number.isInteger(entropy) || timestamp < 0 || counterHi < 0 || counterLo < 0 || entropy < 0 || timestamp > MAX_TIMESTAMP || counterHi > MAX_COUNTER_HI || counterLo > MAX_COUNTER_LO || entropy > 4294967295) {
      throw new RangeError("invalid field value");
    }
    const bytes = new Uint8Array(16);
    bytes[0] = timestamp / 1099511627776;
    bytes[1] = timestamp / 4294967296;
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
    return new _Scru128Id(bytes);
  }
  /** Returns the 48-bit `timestamp` field value. */
  get timestamp() {
    return this.subUint(0, 6);
  }
  /** Returns the 24-bit `counter_hi` field value. */
  get counterHi() {
    return this.subUint(6, 9);
  }
  /** Returns the 24-bit `counter_lo` field value. */
  get counterLo() {
    return this.subUint(9, 12);
  }
  /** Returns the 32-bit `entropy` field value. */
  get entropy() {
    return this.subUint(12, 16);
  }
  /**
   * Creates an object from a 25-digit string representation.
   *
   * @throws SyntaxError if the argument is not a valid string representation.
   * @category Conversion
   */
  static fromString(value) {
    var _a;
    if (value.length !== 25) {
      throw new SyntaxError(
        "invalid length: " + value.length + " (expected 25)"
      );
    }
    const src = new Uint8Array(25);
    for (let i = 0; i < 25; i++) {
      src[i] = (_a = DECODE_MAP[value.charCodeAt(i)]) != null ? _a : 127;
      if (src[i] == 127) {
        const c = String.fromCodePoint(value.codePointAt(i));
        throw new SyntaxError("invalid digit '" + c + "' at " + i);
      }
    }
    return _Scru128Id.fromDigitValues(src);
  }
  /**
   * Creates an object from an array of Base36 digit values representing a
   * 25-digit string representation.
   *
   * @throws SyntaxError if the argument does not contain a valid string
   * representation.
   * @category Conversion
   */
  static fromDigitValues(src) {
    if (src.length !== 25) {
      throw new SyntaxError("invalid length: " + src.length + " (expected 25)");
    }
    const dst = new Uint8Array(16);
    let minIndex = 99;
    for (let i = -7; i < 25; i += 8) {
      let carry = 0;
      for (let j2 = i < 0 ? 0 : i; j2 < i + 8; j2++) {
        const e = src[j2];
        if (e < 0 || e > 35 || !Number.isInteger(e)) {
          throw new SyntaxError("invalid digit at " + j2);
        }
        carry = carry * 36 + e;
      }
      let j = dst.length - 1;
      for (; carry > 0 || j > minIndex; j--) {
        if (j < 0) {
          throw new SyntaxError("out of 128-bit value range");
        }
        carry += dst[j] * 2821109907456;
        const quo = Math.trunc(carry / 256);
        dst[j] = carry & 255;
        carry = quo;
      }
      minIndex = j;
    }
    return new _Scru128Id(dst);
  }
  /**
   * Returns the 25-digit canonical string representation.
   *
   * @category Conversion
   */
  toString() {
    const dst = new Uint8Array(25);
    let minIndex = 99;
    for (let i = -4; i < 16; i += 5) {
      let carry = this.subUint(i < 0 ? 0 : i, i + 5);
      let j = dst.length - 1;
      for (; carry > 0 || j > minIndex; j--) {
        carry += dst[j] * 1099511627776;
        const quo = Math.trunc(carry / 36);
        dst[j] = carry - quo * 36;
        carry = quo;
      }
      minIndex = j;
    }
    let text = "";
    for (const d of dst) {
      text += DIGITS.charAt(d);
    }
    return text;
  }
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
  static fromBytes(value) {
    for (let i = 0; i < value.length; i++) {
      const e = value[i];
      if (e < 0 || e > 255 || !Number.isInteger(e)) {
        throw new SyntaxError("invalid byte value " + e + " at " + i);
      }
    }
    if (value.length === 16) {
      return new _Scru128Id(Uint8Array.from(value));
    } else if (value.length === 25) {
      return _Scru128Id.fromDigitValues(
        Uint8Array.from(value, (c) => {
          var _a;
          return (_a = DECODE_MAP[c]) != null ? _a : 127;
        })
      );
    } else {
      throw new SyntaxError(
        "invalid length of byte array: " + value.length + " bytes"
      );
    }
  }
  /**
   * Creates an object from a 128-bit unsigned integer.
   *
   * @throws RangeError if the argument is out of the range of 128-bit unsigned
   * integer.
   * @category Conversion
   */
  static fromBigInt(value) {
    if (value < 0 || value >> BigInt(128) > 0) {
      throw new RangeError("out of 128-bit value range");
    }
    const bytes = new Uint8Array(16);
    for (let i = 15; i >= 0; i--) {
      bytes[i] = Number(value & BigInt(255));
      value >>= BigInt(8);
    }
    return new _Scru128Id(bytes);
  }
  /**
   * Returns the 128-bit unsigned integer representation.
   *
   * @category Conversion
   */
  toBigInt() {
    return this.bytes.reduce(
      (acc, curr) => acc << BigInt(8) | BigInt(curr),
      BigInt(0)
    );
  }
  /**
   * Creates an object from a 128-bit unsigned integer encoded in a hexadecimal
   * string.
   *
   * @throws SyntaxError if the argument is not a hexadecimal string encoding a
   * 128-bit unsigned integer.
   * @category Conversion
   */
  static fromHex(value) {
    const m = value.match(/^(?:0x)?0*(0|[1-9a-f][0-9a-f]*)$/i);
    if (m === null || m[1].length > 32) {
      throw new SyntaxError("invalid hexadecimal integer");
    }
    const gap = 32 - m[1].length;
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      const pos = i * 2 - gap;
      bytes[i] = (pos < 0 ? 0 : DECODE_MAP[m[1].charCodeAt(pos)] << 4) | (pos + 1 < 0 ? 0 : DECODE_MAP[m[1].charCodeAt(pos + 1)]);
    }
    return new _Scru128Id(bytes);
  }
  /**
   * Returns the 128-bit unsigned integer representation as a 32-digit
   * hexadecimal string prefixed with "0x".
   *
   * @category Conversion
   */
  toHex() {
    const digits = "0123456789abcdef";
    let text = "0x";
    for (const e of this.bytes) {
      text += digits.charAt(e >>> 4);
      text += digits.charAt(e & 15);
    }
    return text;
  }
  /** Represents `this` in JSON as a 25-digit canonical string. */
  toJSON() {
    return this.toString();
  }
  /**
   * Creates an object from `this`.
   *
   * Note that this class is designed to be immutable, and thus `clone()` is not
   * necessary unless properties marked as private are modified directly.
   */
  clone() {
    return new _Scru128Id(this.bytes.slice(0));
  }
  /** Returns true if `this` is equivalent to `other`. */
  equals(other) {
    return this.compareTo(other) === 0;
  }
  /**
   * Returns a negative integer, zero, or positive integer if `this` is less
   * than, equal to, or greater than `other`, respectively.
   */
  compareTo(other) {
    for (let i = 0; i < 16; i++) {
      const diff = this.bytes[i] - other.bytes[i];
      if (diff !== 0) {
        return Math.sign(diff);
      }
    }
    return 0;
  }
  /** Returns a part of `bytes` as an unsigned integer. */
  subUint(beginIndex, endIndex) {
    let buffer = 0;
    while (beginIndex < endIndex) {
      buffer = buffer * 256 + this.bytes[beginIndex++];
    }
    return buffer;
  }
};
__name(_Scru128Id, "Scru128Id");
var Scru128Id = _Scru128Id;
var _Scru128Generator = class _Scru128Generator {
  /**
   * Creates a generator object with the default random number generator, or
   * with the specified one if passed as an argument. The specified random
   * number generator should be cryptographically strong and securely seeded.
   */
  constructor(randomNumberGenerator) {
    this.timestamp = 0;
    this.counterHi = 0;
    this.counterLo = 0;
    /** The timestamp at the last renewal of `counter_hi` field. */
    this.tsCounterHi = 0;
    this.rng = randomNumberGenerator || getDefaultRandom();
  }
  /**
   * Generates a new SCRU128 ID object from the current `timestamp`, or resets
   * the generator upon significant timestamp rollback.
   *
   * See the {@link Scru128Generator} class documentation for the description.
   */
  generate() {
    return this.generateOrResetCore(Date.now(), DEFAULT_ROLLBACK_ALLOWANCE);
  }
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
  generateOrAbort() {
    return this.generateOrAbortCore(Date.now(), DEFAULT_ROLLBACK_ALLOWANCE);
  }
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
  generateOrResetCore(timestamp, rollbackAllowance) {
    let value = this.generateOrAbortCore(timestamp, rollbackAllowance);
    if (value === void 0) {
      this.timestamp = 0;
      this.tsCounterHi = 0;
      value = this.generateOrAbortCore(timestamp, rollbackAllowance);
    }
    return value;
  }
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
  generateOrAbortCore(timestamp, rollbackAllowance) {
    if (!Number.isInteger(timestamp) || timestamp < 1 || timestamp > MAX_TIMESTAMP) {
      throw new RangeError("`timestamp` must be a 48-bit positive integer");
    } else if (rollbackAllowance < 0 || rollbackAllowance > MAX_TIMESTAMP) {
      throw new RangeError("`rollbackAllowance` out of reasonable range");
    }
    if (timestamp > this.timestamp) {
      this.timestamp = timestamp;
      this.counterLo = this.rng.nextUint32() & MAX_COUNTER_LO;
    } else if (timestamp + rollbackAllowance >= this.timestamp) {
      this.counterLo++;
      if (this.counterLo > MAX_COUNTER_LO) {
        this.counterLo = 0;
        this.counterHi++;
        if (this.counterHi > MAX_COUNTER_HI) {
          this.counterHi = 0;
          this.timestamp++;
          this.counterLo = this.rng.nextUint32() & MAX_COUNTER_LO;
        }
      }
    } else {
      return void 0;
    }
    if (this.timestamp - this.tsCounterHi >= 1e3 || this.tsCounterHi < 1) {
      this.tsCounterHi = this.timestamp;
      this.counterHi = this.rng.nextUint32() & MAX_COUNTER_HI;
    }
    return Scru128Id.fromFields(
      this.timestamp,
      this.counterHi,
      this.counterLo,
      this.rng.nextUint32()
    );
  }
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
  [Symbol.iterator]() {
    return this;
  }
  /**
   * Returns a new SCRU128 ID object for each call, infinitely.
   *
   * This method wraps the result of {@link generate} in an [`IteratorResult`]
   * object to use `this` as an infinite iterator.
   *
   * [`IteratorResult`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Iteration_protocols
   */
  next() {
    return { value: this.generate(), done: false };
  }
};
__name(_Scru128Generator, "Scru128Generator");
var Scru128Generator = _Scru128Generator;
var getDefaultRandom = /* @__PURE__ */ __name(() => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues !== "undefined") {
    return new BufferedCryptoRandom();
  } else {
    if (typeof SCRU128_DENY_WEAK_RNG !== "undefined" && SCRU128_DENY_WEAK_RNG) {
      throw new Error("no cryptographically strong RNG available");
    }
    return {
      nextUint32: /* @__PURE__ */ __name(() => Math.trunc(Math.random() * 65536) * 65536 + Math.trunc(Math.random() * 65536), "nextUint32")
    };
  }
}, "getDefaultRandom");
var _BufferedCryptoRandom = class _BufferedCryptoRandom {
  constructor() {
    this.buffer = new Uint32Array(8);
    this.cursor = 65535;
  }
  nextUint32() {
    if (this.cursor >= this.buffer.length) {
      crypto.getRandomValues(this.buffer);
      this.cursor = 0;
    }
    return this.buffer[this.cursor++];
  }
};
__name(_BufferedCryptoRandom, "BufferedCryptoRandom");
var BufferedCryptoRandom = _BufferedCryptoRandom;
var globalGenerator;
var scru128 = /* @__PURE__ */ __name(() => (globalGenerator || (globalGenerator = new Scru128Generator())).generate(), "scru128");
var scru128String = /* @__PURE__ */ __name(() => scru128().toString(), "scru128String");
export {
  Scru128Generator,
  Scru128Id,
  scru128,
  scru128String
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIFNDUlUxMjg6IFNvcnRhYmxlLCBDbG9jayBhbmQgUmFuZG9tIG51bWJlci1iYXNlZCBVbmlxdWUgaWRlbnRpZmllclxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiBpbXBvcnQgeyBzY3J1MTI4LCBzY3J1MTI4U3RyaW5nIH0gZnJvbSBcInNjcnUxMjhcIjtcbiAqIC8vIG9yIG9uIGJyb3dzZXJzOlxuICogLy8gaW1wb3J0IHsgc2NydTEyOCwgc2NydTEyOFN0cmluZyB9IGZyb20gXCJodHRwczovL3VucGtnLmNvbS9zY3J1MTI4QF4zXCI7XG4gKlxuICogLy8gZ2VuZXJhdGUgYSBuZXcgaWRlbnRpZmllciBvYmplY3RcbiAqIGNvbnN0IHggPSBzY3J1MTI4KCk7XG4gKiBjb25zb2xlLmxvZyhTdHJpbmcoeCkpOyAvLyBlLmcuLCBcIjAzNno5NTFtaGppa3ppazJnc2w4MWdyN2xcIlxuICogY29uc29sZS5sb2coeC50b0JpZ0ludCgpKTsgLy8gYXMgYSAxMjgtYml0IHVuc2lnbmVkIGludGVnZXJcbiAqXG4gKiAvLyBnZW5lcmF0ZSBhIHRleHR1YWwgcmVwcmVzZW50YXRpb24gZGlyZWN0bHlcbiAqIGNvbnNvbGUubG9nKHNjcnUxMjhTdHJpbmcoKSk7IC8vIGUuZy4sIFwiMDM2ejk1MW1oeng2N3Q2M21xOXhlNnEwalwiXG4gKiBgYGBcbiAqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqL1xuXG4vKiogVGhlIG1heGltdW0gdmFsdWUgb2YgNDgtYml0IGB0aW1lc3RhbXBgIGZpZWxkLiAqL1xuY29uc3QgTUFYX1RJTUVTVEFNUCA9IDB4ZmZmZl9mZmZmX2ZmZmY7XG5cbi8qKiBUaGUgbWF4aW11bSB2YWx1ZSBvZiAyNC1iaXQgYGNvdW50ZXJfaGlgIGZpZWxkLiAqL1xuY29uc3QgTUFYX0NPVU5URVJfSEkgPSAweGZmX2ZmZmY7XG5cbi8qKiBUaGUgbWF4aW11bSB2YWx1ZSBvZiAyNC1iaXQgYGNvdW50ZXJfbG9gIGZpZWxkLiAqL1xuY29uc3QgTUFYX0NPVU5URVJfTE8gPSAweGZmX2ZmZmY7XG5cbi8qKiBEaWdpdCBjaGFyYWN0ZXJzIHVzZWQgaW4gdGhlIEJhc2UzNiBub3RhdGlvbi4gKi9cbmNvbnN0IERJR0lUUyA9IFwiMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XG5cbi8qKiBBbiBPKDEpIG1hcCBmcm9tIEFTQ0lJIGNvZGUgcG9pbnRzIHRvIEJhc2UzNiBkaWdpdCB2YWx1ZXMuICovXG5jb25zdCBERUNPREVfTUFQID0gW1xuICAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLFxuICAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLFxuICAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLFxuICAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDAwLCAweDAxLCAweDAyLCAweDAzLFxuICAweDA0LCAweDA1LCAweDA2LCAweDA3LCAweDA4LCAweDA5LCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLFxuICAweDBhLCAweDBiLCAweDBjLCAweDBkLCAweDBlLCAweDBmLCAweDEwLCAweDExLCAweDEyLCAweDEzLCAweDE0LCAweDE1LCAweDE2LFxuICAweDE3LCAweDE4LCAweDE5LCAweDFhLCAweDFiLCAweDFjLCAweDFkLCAweDFlLCAweDFmLCAweDIwLCAweDIxLCAweDIyLCAweDIzLFxuICAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDBhLCAweDBiLCAweDBjLCAweDBkLCAweDBlLCAweDBmLCAweDEwLFxuICAweDExLCAweDEyLCAweDEzLCAweDE0LCAweDE1LCAweDE2LCAweDE3LCAweDE4LCAweDE5LCAweDFhLCAweDFiLCAweDFjLCAweDFkLFxuICAweDFlLCAweDFmLCAweDIwLCAweDIxLCAweDIyLCAweDIzLCAweDdmLCAweDdmLCAweDdmLCAweDdmLCAweDdmLFxuXTtcblxuLyoqIFRoZSBkZWZhdWx0IHRpbWVzdGFtcCByb2xsYmFjayBhbGxvd2FuY2UuICovXG5jb25zdCBERUZBVUxUX1JPTExCQUNLX0FMTE9XQU5DRSA9IDEwXzAwMDsgLy8gMTAgc2Vjb25kc1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBTQ1JVMTI4IElEIGFuZCBwcm92aWRlcyBjb252ZXJ0ZXJzIGFuZCBjb21wYXJpc29uIG9wZXJhdG9ycy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaW1wb3J0IHsgU2NydTEyOElkIH0gZnJvbSBcInNjcnUxMjhcIjtcbiAqXG4gKiBjb25zdCB4ID0gU2NydTEyOElkLmZyb21TdHJpbmcoXCIwMzZ6OTY4ZnUydHVneTdzdmtmem5ld2trXCIpO1xuICogY29uc29sZS5sb2coU3RyaW5nKHgpKTtcbiAqXG4gKiBjb25zdCB5ID0gU2NydTEyOElkLmZyb21CaWdJbnQoMHgwMTdmYTFkZTUxYTgwZmQ5OTJmOWU4Y2MyZDVlYjg4ZW4pO1xuICogY29uc29sZS5sb2coeS50b0JpZ0ludCgpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgU2NydTEyOElkIHtcbiAgLyoqXG4gICAqIEEgMTYtYnl0ZSBieXRlIGFycmF5IGNvbnRhaW5pbmcgdGhlIDEyOC1iaXQgdW5zaWduZWQgaW50ZWdlciByZXByZXNlbnRhdGlvblxuICAgKiBpbiB0aGUgYmlnLWVuZGlhbiAobmV0d29yaykgYnl0ZSBvcmRlci5cbiAgICovXG4gIHJlYWRvbmx5IGJ5dGVzOiBSZWFkb25seTxVaW50OEFycmF5PjtcblxuICAvKiogQ3JlYXRlcyBhbiBvYmplY3QgZnJvbSBhIDE2LWJ5dGUgYnl0ZSBhcnJheS4gKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihieXRlczogUmVhZG9ubHk8VWludDhBcnJheT4pIHtcbiAgICB0aGlzLmJ5dGVzID0gYnl0ZXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgZnJvbSB0aGUgaW50ZXJuYWwgcmVwcmVzZW50YXRpb24sIGEgMTYtYnl0ZSBieXRlIGFycmF5XG4gICAqIGNvbnRhaW5pbmcgdGhlIDEyOC1iaXQgdW5zaWduZWQgaW50ZWdlciByZXByZXNlbnRhdGlvbiBpbiB0aGUgYmlnLWVuZGlhblxuICAgKiAobmV0d29yaykgYnl0ZSBvcmRlci5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZG9lcyBOT1Qgc2hhbGxvdy1jb3B5IHRoZSBhcmd1bWVudCwgYW5kIHRodXMgdGhlIGNyZWF0ZWQgb2JqZWN0XG4gICAqIGhvbGRzIHRoZSByZWZlcmVuY2UgdG8gdGhlIHVuZGVybHlpbmcgYnVmZmVyLlxuICAgKlxuICAgKiBAdGhyb3dzIFR5cGVFcnJvciBpZiB0aGUgbGVuZ3RoIG9mIHRoZSBhcmd1bWVudCBpcyBub3QgMTYuXG4gICAqL1xuICBzdGF0aWMgb2ZJbm5lcihieXRlczogVWludDhBcnJheSkge1xuICAgIGlmIChieXRlcy5sZW5ndGggPT09IDE2KSB7XG4gICAgICByZXR1cm4gbmV3IFNjcnUxMjhJZChieXRlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIFwiaW52YWxpZCBsZW5ndGggb2YgYnl0ZSBhcnJheTogXCIgK1xuICAgICAgICAgIGJ5dGVzLmxlbmd0aCArXG4gICAgICAgICAgXCIgYnl0ZXMgKGV4cGVjdGVkIDE2KVwiLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgZnJvbSBmaWVsZCB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB0aW1lc3RhbXAgLSBBIDQ4LWJpdCBgdGltZXN0YW1wYCBmaWVsZCB2YWx1ZS5cbiAgICogQHBhcmFtIGNvdW50ZXJIaSAtIEEgMjQtYml0IGBjb3VudGVyX2hpYCBmaWVsZCB2YWx1ZS5cbiAgICogQHBhcmFtIGNvdW50ZXJMbyAtIEEgMjQtYml0IGBjb3VudGVyX2xvYCBmaWVsZCB2YWx1ZS5cbiAgICogQHBhcmFtIGVudHJvcHkgLSBBIDMyLWJpdCBgZW50cm9weWAgZmllbGQgdmFsdWUuXG4gICAqIEB0aHJvd3MgUmFuZ2VFcnJvciBpZiBhbnkgYXJndW1lbnQgaXMgb3V0IG9mIHRoZSB2YWx1ZSByYW5nZSBvZiB0aGUgZmllbGQuXG4gICAqIEBjYXRlZ29yeSBDb252ZXJzaW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbUZpZWxkcyhcbiAgICB0aW1lc3RhbXA6IG51bWJlcixcbiAgICBjb3VudGVySGk6IG51bWJlcixcbiAgICBjb3VudGVyTG86IG51bWJlcixcbiAgICBlbnRyb3B5OiBudW1iZXIsXG4gICk6IFNjcnUxMjhJZCB7XG4gICAgaWYgKFxuICAgICAgIU51bWJlci5pc0ludGVnZXIodGltZXN0YW1wKSB8fFxuICAgICAgIU51bWJlci5pc0ludGVnZXIoY291bnRlckhpKSB8fFxuICAgICAgIU51bWJlci5pc0ludGVnZXIoY291bnRlckxvKSB8fFxuICAgICAgIU51bWJlci5pc0ludGVnZXIoZW50cm9weSkgfHxcbiAgICAgIHRpbWVzdGFtcCA8IDAgfHxcbiAgICAgIGNvdW50ZXJIaSA8IDAgfHxcbiAgICAgIGNvdW50ZXJMbyA8IDAgfHxcbiAgICAgIGVudHJvcHkgPCAwIHx8XG4gICAgICB0aW1lc3RhbXAgPiBNQVhfVElNRVNUQU1QIHx8XG4gICAgICBjb3VudGVySGkgPiBNQVhfQ09VTlRFUl9ISSB8fFxuICAgICAgY291bnRlckxvID4gTUFYX0NPVU5URVJfTE8gfHxcbiAgICAgIGVudHJvcHkgPiAweGZmZmZfZmZmZlxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJpbnZhbGlkIGZpZWxkIHZhbHVlXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICAgIGJ5dGVzWzBdID0gdGltZXN0YW1wIC8gMHgxMDBfMDAwMF8wMDAwO1xuICAgIGJ5dGVzWzFdID0gdGltZXN0YW1wIC8gMHgxXzAwMDBfMDAwMDtcbiAgICBieXRlc1syXSA9IHRpbWVzdGFtcCA+Pj4gMjQ7XG4gICAgYnl0ZXNbM10gPSB0aW1lc3RhbXAgPj4+IDE2O1xuICAgIGJ5dGVzWzRdID0gdGltZXN0YW1wID4+PiA4O1xuICAgIGJ5dGVzWzVdID0gdGltZXN0YW1wO1xuICAgIGJ5dGVzWzZdID0gY291bnRlckhpID4+PiAxNjtcbiAgICBieXRlc1s3XSA9IGNvdW50ZXJIaSA+Pj4gODtcbiAgICBieXRlc1s4XSA9IGNvdW50ZXJIaTtcbiAgICBieXRlc1s5XSA9IGNvdW50ZXJMbyA+Pj4gMTY7XG4gICAgYnl0ZXNbMTBdID0gY291bnRlckxvID4+PiA4O1xuICAgIGJ5dGVzWzExXSA9IGNvdW50ZXJMbztcbiAgICBieXRlc1sxMl0gPSBlbnRyb3B5ID4+PiAyNDtcbiAgICBieXRlc1sxM10gPSBlbnRyb3B5ID4+PiAxNjtcbiAgICBieXRlc1sxNF0gPSBlbnRyb3B5ID4+PiA4O1xuICAgIGJ5dGVzWzE1XSA9IGVudHJvcHk7XG4gICAgcmV0dXJuIG5ldyBTY3J1MTI4SWQoYnl0ZXMpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIDQ4LWJpdCBgdGltZXN0YW1wYCBmaWVsZCB2YWx1ZS4gKi9cbiAgZ2V0IHRpbWVzdGFtcCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN1YlVpbnQoMCwgNik7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgMjQtYml0IGBjb3VudGVyX2hpYCBmaWVsZCB2YWx1ZS4gKi9cbiAgZ2V0IGNvdW50ZXJIaSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN1YlVpbnQoNiwgOSk7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgMjQtYml0IGBjb3VudGVyX2xvYCBmaWVsZCB2YWx1ZS4gKi9cbiAgZ2V0IGNvdW50ZXJMbygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnN1YlVpbnQoOSwgMTIpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIDMyLWJpdCBgZW50cm9weWAgZmllbGQgdmFsdWUuICovXG4gIGdldCBlbnRyb3B5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3ViVWludCgxMiwgMTYpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb2JqZWN0IGZyb20gYSAyNS1kaWdpdCBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAqXG4gICAqIEB0aHJvd3MgU3ludGF4RXJyb3IgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhIHZhbGlkIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICogQGNhdGVnb3J5IENvbnZlcnNpb25cbiAgICovXG4gIHN0YXRpYyBmcm9tU3RyaW5nKHZhbHVlOiBzdHJpbmcpOiBTY3J1MTI4SWQge1xuICAgIGlmICh2YWx1ZS5sZW5ndGggIT09IDI1KSB7XG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgIFwiaW52YWxpZCBsZW5ndGg6IFwiICsgdmFsdWUubGVuZ3RoICsgXCIgKGV4cGVjdGVkIDI1KVwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzcmMgPSBuZXcgVWludDhBcnJheSgyNSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyNTsgaSsrKSB7XG4gICAgICBzcmNbaV0gPSBERUNPREVfTUFQW3ZhbHVlLmNoYXJDb2RlQXQoaSldID8/IDB4N2Y7XG4gICAgICBpZiAoc3JjW2ldID09IDB4N2YpIHtcbiAgICAgICAgY29uc3QgYyA9IFN0cmluZy5mcm9tQ29kZVBvaW50KHZhbHVlLmNvZGVQb2ludEF0KGkpISk7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcImludmFsaWQgZGlnaXQgJ1wiICsgYyArIFwiJyBhdCBcIiArIGkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBTY3J1MTI4SWQuZnJvbURpZ2l0VmFsdWVzKHNyYyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgZnJvbSBhbiBhcnJheSBvZiBCYXNlMzYgZGlnaXQgdmFsdWVzIHJlcHJlc2VudGluZyBhXG4gICAqIDI1LWRpZ2l0IHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICpcbiAgICogQHRocm93cyBTeW50YXhFcnJvciBpZiB0aGUgYXJndW1lbnQgZG9lcyBub3QgY29udGFpbiBhIHZhbGlkIHN0cmluZ1xuICAgKiByZXByZXNlbnRhdGlvbi5cbiAgICogQGNhdGVnb3J5IENvbnZlcnNpb25cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIGZyb21EaWdpdFZhbHVlcyhzcmM6IEFycmF5TGlrZTxudW1iZXI+KTogU2NydTEyOElkIHtcbiAgICBpZiAoc3JjLmxlbmd0aCAhPT0gMjUpIHtcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcImludmFsaWQgbGVuZ3RoOiBcIiArIHNyYy5sZW5ndGggKyBcIiAoZXhwZWN0ZWQgMjUpXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGRzdCA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgICBsZXQgbWluSW5kZXggPSA5OTsgLy8gYW55IG51bWJlciBncmVhdGVyIHRoYW4gc2l6ZSBvZiBvdXRwdXQgYXJyYXlcbiAgICBmb3IgKGxldCBpID0gLTc7IGkgPCAyNTsgaSArPSA4KSB7XG4gICAgICAvLyBpbXBsZW1lbnQgQmFzZTM2IHVzaW5nIDgtZGlnaXQgd29yZHNcbiAgICAgIGxldCBjYXJyeSA9IDA7XG4gICAgICBmb3IgKGxldCBqID0gaSA8IDAgPyAwIDogaTsgaiA8IGkgKyA4OyBqKyspIHtcbiAgICAgICAgY29uc3QgZSA9IHNyY1tqXTtcbiAgICAgICAgaWYgKGUgPCAwIHx8IGUgPiAzNSB8fCAhTnVtYmVyLmlzSW50ZWdlcihlKSkge1xuICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcImludmFsaWQgZGlnaXQgYXQgXCIgKyBqKTtcbiAgICAgICAgfVxuICAgICAgICBjYXJyeSA9IGNhcnJ5ICogMzYgKyBlO1xuICAgICAgfVxuXG4gICAgICAvLyBpdGVyYXRlIG92ZXIgb3V0cHV0IGFycmF5IGZyb20gcmlnaHQgdG8gbGVmdCB3aGlsZSBjYXJyeSAhPSAwIGJ1dCBhdFxuICAgICAgLy8gbGVhc3QgdXAgdG8gcGxhY2UgYWxyZWFkeSBmaWxsZWRcbiAgICAgIGxldCBqID0gZHN0Lmxlbmd0aCAtIDE7XG4gICAgICBmb3IgKDsgY2FycnkgPiAwIHx8IGogPiBtaW5JbmRleDsgai0tKSB7XG4gICAgICAgIGlmIChqIDwgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIm91dCBvZiAxMjgtYml0IHZhbHVlIHJhbmdlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNhcnJ5ICs9IGRzdFtqXSAqIDI4MjExMDk5MDc0NTY7IC8vIDM2ICoqIDhcbiAgICAgICAgY29uc3QgcXVvID0gTWF0aC50cnVuYyhjYXJyeSAvIDB4MTAwKTtcbiAgICAgICAgZHN0W2pdID0gY2FycnkgJiAweGZmOyAvLyByZW1haW5kZXJcbiAgICAgICAgY2FycnkgPSBxdW87XG4gICAgICB9XG4gICAgICBtaW5JbmRleCA9IGo7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTY3J1MTI4SWQoZHN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSAyNS1kaWdpdCBjYW5vbmljYWwgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKlxuICAgKiBAY2F0ZWdvcnkgQ29udmVyc2lvblxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICBjb25zdCBkc3QgPSBuZXcgVWludDhBcnJheSgyNSk7XG4gICAgbGV0IG1pbkluZGV4ID0gOTk7IC8vIGFueSBudW1iZXIgZ3JlYXRlciB0aGFuIHNpemUgb2Ygb3V0cHV0IGFycmF5XG4gICAgZm9yIChsZXQgaSA9IC00OyBpIDwgMTY7IGkgKz0gNSkge1xuICAgICAgLy8gaW1wbGVtZW50IEJhc2UzNiB1c2luZyA0MC1iaXQgd29yZHNcbiAgICAgIGxldCBjYXJyeSA9IHRoaXMuc3ViVWludChpIDwgMCA/IDAgOiBpLCBpICsgNSk7XG5cbiAgICAgIC8vIGl0ZXJhdGUgb3ZlciBvdXRwdXQgYXJyYXkgZnJvbSByaWdodCB0byBsZWZ0IHdoaWxlIGNhcnJ5ICE9IDAgYnV0IGF0XG4gICAgICAvLyBsZWFzdCB1cCB0byBwbGFjZSBhbHJlYWR5IGZpbGxlZFxuICAgICAgbGV0IGogPSBkc3QubGVuZ3RoIC0gMTtcbiAgICAgIGZvciAoOyBjYXJyeSA+IDAgfHwgaiA+IG1pbkluZGV4OyBqLS0pIHtcbiAgICAgICAgLy8gY29uc29sZS5hc3NlcnQoaiA+PSAwKTtcbiAgICAgICAgY2FycnkgKz0gZHN0W2pdICogMHgxMDBfMDAwMF8wMDAwO1xuICAgICAgICBjb25zdCBxdW8gPSBNYXRoLnRydW5jKGNhcnJ5IC8gMzYpO1xuICAgICAgICBkc3Rbal0gPSBjYXJyeSAtIHF1byAqIDM2OyAvLyByZW1haW5kZXJcbiAgICAgICAgY2FycnkgPSBxdW87XG4gICAgICB9XG4gICAgICBtaW5JbmRleCA9IGo7XG4gICAgfVxuXG4gICAgbGV0IHRleHQgPSBcIlwiO1xuICAgIGZvciAoY29uc3QgZCBvZiBkc3QpIHtcbiAgICAgIHRleHQgKz0gRElHSVRTLmNoYXJBdChkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgZnJvbSBhIGJ5dGUgYXJyYXkgcmVwcmVzZW50aW5nIGVpdGhlciBhIDEyOC1iaXQgdW5zaWduZWRcbiAgICogaW50ZWdlciBvciBhIDI1LWRpZ2l0IEJhc2UzNiBzdHJpbmcuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIHNoYWxsb3ctY29waWVzIHRoZSBjb250ZW50IG9mIHRoZSBhcmd1bWVudCwgc28gdGhlIGNyZWF0ZWRcbiAgICogb2JqZWN0IGhvbGRzIGFub3RoZXIgaW5zdGFuY2Ugb2YgdGhlIGJ5dGUgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIEFuIGFycmF5IG9mIDE2IGJ5dGVzIHRoYXQgY29udGFpbnMgYSAxMjgtYml0IHVuc2lnbmVkXG4gICAqIGludGVnZXIgaW4gdGhlIGJpZy1lbmRpYW4gKG5ldHdvcmspIGJ5dGUgb3JkZXIgb3IgYW4gYXJyYXkgb2YgMjUgQVNDSUkgY29kZVxuICAgKiBwb2ludHMgdGhhdCByZWFkcyBhIDI1LWRpZ2l0IEJhc2UzNiBzdHJpbmcuXG4gICAqIEB0aHJvd3MgU3ludGF4RXJyb3IgaWYgY29udmVyc2lvbiBmYWlscy5cbiAgICogQGNhdGVnb3J5IENvbnZlcnNpb25cbiAgICovXG4gIHN0YXRpYyBmcm9tQnl0ZXModmFsdWU6IEFycmF5TGlrZTxudW1iZXI+KTogU2NydTEyOElkIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlID0gdmFsdWVbaV07XG4gICAgICBpZiAoZSA8IDAgfHwgZSA+IDB4ZmYgfHwgIU51bWJlci5pc0ludGVnZXIoZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiaW52YWxpZCBieXRlIHZhbHVlIFwiICsgZSArIFwiIGF0IFwiICsgaSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDE2KSB7XG4gICAgICByZXR1cm4gbmV3IFNjcnUxMjhJZChVaW50OEFycmF5LmZyb20odmFsdWUpKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMjUpIHtcbiAgICAgIHJldHVybiBTY3J1MTI4SWQuZnJvbURpZ2l0VmFsdWVzKFxuICAgICAgICBVaW50OEFycmF5LmZyb20odmFsdWUsIChjKSA9PiBERUNPREVfTUFQW2NdID8/IDB4N2YpLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICBcImludmFsaWQgbGVuZ3RoIG9mIGJ5dGUgYXJyYXk6IFwiICsgdmFsdWUubGVuZ3RoICsgXCIgYnl0ZXNcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb2JqZWN0IGZyb20gYSAxMjgtYml0IHVuc2lnbmVkIGludGVnZXIuXG4gICAqXG4gICAqIEB0aHJvd3MgUmFuZ2VFcnJvciBpZiB0aGUgYXJndW1lbnQgaXMgb3V0IG9mIHRoZSByYW5nZSBvZiAxMjgtYml0IHVuc2lnbmVkXG4gICAqIGludGVnZXIuXG4gICAqIEBjYXRlZ29yeSBDb252ZXJzaW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbUJpZ0ludCh2YWx1ZTogYmlnaW50KTogU2NydTEyOElkIHtcbiAgICBpZiAodmFsdWUgPCAwIHx8IHZhbHVlID4+IEJpZ0ludCgxMjgpID4gMCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJvdXQgb2YgMTI4LWJpdCB2YWx1ZSByYW5nZVwiKTtcbiAgICB9XG4gICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheSgxNik7XG4gICAgZm9yIChsZXQgaSA9IDE1OyBpID49IDA7IGktLSkge1xuICAgICAgYnl0ZXNbaV0gPSBOdW1iZXIodmFsdWUgJiBCaWdJbnQoMHhmZikpO1xuICAgICAgdmFsdWUgPj49IEJpZ0ludCg4KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTY3J1MTI4SWQoYnl0ZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIDEyOC1iaXQgdW5zaWduZWQgaW50ZWdlciByZXByZXNlbnRhdGlvbi5cbiAgICpcbiAgICogQGNhdGVnb3J5IENvbnZlcnNpb25cbiAgICovXG4gIHRvQmlnSW50KCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMuYnl0ZXMucmVkdWNlKFxuICAgICAgKGFjYywgY3VycikgPT4gKGFjYyA8PCBCaWdJbnQoOCkpIHwgQmlnSW50KGN1cnIpLFxuICAgICAgQmlnSW50KDApLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvYmplY3QgZnJvbSBhIDEyOC1iaXQgdW5zaWduZWQgaW50ZWdlciBlbmNvZGVkIGluIGEgaGV4YWRlY2ltYWxcbiAgICogc3RyaW5nLlxuICAgKlxuICAgKiBAdGhyb3dzIFN5bnRheEVycm9yIGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBoZXhhZGVjaW1hbCBzdHJpbmcgZW5jb2RpbmcgYVxuICAgKiAxMjgtYml0IHVuc2lnbmVkIGludGVnZXIuXG4gICAqIEBjYXRlZ29yeSBDb252ZXJzaW9uXG4gICAqL1xuICBzdGF0aWMgZnJvbUhleCh2YWx1ZTogc3RyaW5nKTogU2NydTEyOElkIHtcbiAgICBjb25zdCBtID0gdmFsdWUubWF0Y2goL14oPzoweCk/MCooMHxbMS05YS1mXVswLTlhLWZdKikkL2kpO1xuICAgIGlmIChtID09PSBudWxsIHx8IG1bMV0ubGVuZ3RoID4gMzIpIHtcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcImludmFsaWQgaGV4YWRlY2ltYWwgaW50ZWdlclwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBnYXAgPSAzMiAtIG1bMV0ubGVuZ3RoO1xuICAgIGNvbnN0IGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgY29uc3QgcG9zID0gaSAqIDIgLSBnYXA7XG4gICAgICBieXRlc1tpXSA9XG4gICAgICAgIChwb3MgPCAwID8gMCA6IERFQ09ERV9NQVBbbVsxXS5jaGFyQ29kZUF0KHBvcyldIDw8IDQpIHxcbiAgICAgICAgKHBvcyArIDEgPCAwID8gMCA6IERFQ09ERV9NQVBbbVsxXS5jaGFyQ29kZUF0KHBvcyArIDEpXSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2NydTEyOElkKGJ5dGVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSAxMjgtYml0IHVuc2lnbmVkIGludGVnZXIgcmVwcmVzZW50YXRpb24gYXMgYSAzMi1kaWdpdFxuICAgKiBoZXhhZGVjaW1hbCBzdHJpbmcgcHJlZml4ZWQgd2l0aCBcIjB4XCIuXG4gICAqXG4gICAqIEBjYXRlZ29yeSBDb252ZXJzaW9uXG4gICAqL1xuICB0b0hleCgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGRpZ2l0cyA9IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuICAgIGxldCB0ZXh0ID0gXCIweFwiO1xuICAgIGZvciAoY29uc3QgZSBvZiB0aGlzLmJ5dGVzKSB7XG4gICAgICB0ZXh0ICs9IGRpZ2l0cy5jaGFyQXQoZSA+Pj4gNCk7XG4gICAgICB0ZXh0ICs9IGRpZ2l0cy5jaGFyQXQoZSAmIDB4Zik7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgLyoqIFJlcHJlc2VudHMgYHRoaXNgIGluIEpTT04gYXMgYSAyNS1kaWdpdCBjYW5vbmljYWwgc3RyaW5nLiAqL1xuICB0b0pTT04oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gb2JqZWN0IGZyb20gYHRoaXNgLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBjbGFzcyBpcyBkZXNpZ25lZCB0byBiZSBpbW11dGFibGUsIGFuZCB0aHVzIGBjbG9uZSgpYCBpcyBub3RcbiAgICogbmVjZXNzYXJ5IHVubGVzcyBwcm9wZXJ0aWVzIG1hcmtlZCBhcyBwcml2YXRlIGFyZSBtb2RpZmllZCBkaXJlY3RseS5cbiAgICovXG4gIGNsb25lKCk6IFNjcnUxMjhJZCB7XG4gICAgcmV0dXJuIG5ldyBTY3J1MTI4SWQodGhpcy5ieXRlcy5zbGljZSgwKSk7XG4gIH1cblxuICAvKiogUmV0dXJucyB0cnVlIGlmIGB0aGlzYCBpcyBlcXVpdmFsZW50IHRvIGBvdGhlcmAuICovXG4gIGVxdWFscyhvdGhlcjogU2NydTEyOElkKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY29tcGFyZVRvKG90aGVyKSA9PT0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmVnYXRpdmUgaW50ZWdlciwgemVybywgb3IgcG9zaXRpdmUgaW50ZWdlciBpZiBgdGhpc2AgaXMgbGVzc1xuICAgKiB0aGFuLCBlcXVhbCB0bywgb3IgZ3JlYXRlciB0aGFuIGBvdGhlcmAsIHJlc3BlY3RpdmVseS5cbiAgICovXG4gIGNvbXBhcmVUbyhvdGhlcjogU2NydTEyOElkKTogbnVtYmVyIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgIGNvbnN0IGRpZmYgPSB0aGlzLmJ5dGVzW2ldIC0gb3RoZXIuYnl0ZXNbaV07XG4gICAgICBpZiAoZGlmZiAhPT0gMCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zaWduKGRpZmYpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIGEgcGFydCBvZiBgYnl0ZXNgIGFzIGFuIHVuc2lnbmVkIGludGVnZXIuICovXG4gIHByaXZhdGUgc3ViVWludChiZWdpbkluZGV4OiBudW1iZXIsIGVuZEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICAgIGxldCBidWZmZXIgPSAwO1xuICAgIHdoaWxlIChiZWdpbkluZGV4IDwgZW5kSW5kZXgpIHtcbiAgICAgIGJ1ZmZlciA9IGJ1ZmZlciAqIDB4MTAwICsgdGhpcy5ieXRlc1tiZWdpbkluZGV4KytdO1xuICAgIH1cbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG59XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIFNDUlUxMjggSUQgZ2VuZXJhdG9yIHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBtb25vdG9uaWMgY291bnRlcnNcbiAqIGFuZCBvdGhlciBpbnRlcm5hbCBzdGF0ZXMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYGphdmFzY3JpcHRcbiAqIGltcG9ydCB7IFNjcnUxMjhHZW5lcmF0b3IgfSBmcm9tIFwic2NydTEyOFwiO1xuICpcbiAqIGNvbnN0IGcgPSBuZXcgU2NydTEyOEdlbmVyYXRvcigpO1xuICogY29uc3QgeCA9IGcuZ2VuZXJhdGUoKTtcbiAqIGNvbnNvbGUubG9nKFN0cmluZyh4KSk7XG4gKiBjb25zb2xlLmxvZyh4LnRvQmlnSW50KCkpO1xuICogYGBgXG4gKlxuICogQHJlbWFya3NcbiAqIFRoZSBnZW5lcmF0b3IgY29tZXMgd2l0aCBmb3VyIGRpZmZlcmVudCBtZXRob2RzIHRoYXQgZ2VuZXJhdGUgYSBTQ1JVMTI4IElEOlxuICpcbiAqIHwgRmxhdm9yICAgICAgICAgICAgICAgICAgICAgIHwgVGltZXN0YW1wIHwgT24gYmlnIGNsb2NrIHJld2luZCB8XG4gKiB8IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSB8IC0tLS0tLS0tLSB8IC0tLS0tLS0tLS0tLS0tLS0tLS0gfFxuICogfCB7QGxpbmsgZ2VuZXJhdGV9ICAgICAgICAgICAgfCBOb3cgICAgICAgfCBSZXNldHMgZ2VuZXJhdG9yICAgIHxcbiAqIHwge0BsaW5rIGdlbmVyYXRlT3JBYm9ydH0gICAgIHwgTm93ICAgICAgIHwgUmV0dXJucyBgdW5kZWZpbmVkYCB8XG4gKiB8IHtAbGluayBnZW5lcmF0ZU9yUmVzZXRDb3JlfSB8IEFyZ3VtZW50ICB8IFJlc2V0cyBnZW5lcmF0b3IgICAgfFxuICogfCB7QGxpbmsgZ2VuZXJhdGVPckFib3J0Q29yZX0gfCBBcmd1bWVudCAgfCBSZXR1cm5zIGB1bmRlZmluZWRgIHxcbiAqXG4gKiBBbGwgb2YgdGhlIGZvdXIgcmV0dXJuIGEgbW9ub3RvbmljYWxseSBpbmNyZWFzaW5nIElEIGJ5IHJldXNpbmcgdGhlIHByZXZpb3VzXG4gKiBgdGltZXN0YW1wYCBldmVuIGlmIHRoZSBvbmUgcHJvdmlkZWQgaXMgc21hbGxlciB0aGFuIHRoZSBpbW1lZGlhdGVseVxuICogcHJlY2VkaW5nIElEJ3MuIEhvd2V2ZXIsIHdoZW4gc3VjaCBhIGNsb2NrIHJvbGxiYWNrIGlzIGNvbnNpZGVyZWQgc2lnbmlmaWNhbnRcbiAqIChieSBkZWZhdWx0LCBtb3JlIHRoYW4gdGVuIHNlY29uZHMpOlxuICpcbiAqIDEuIGBnZW5lcmF0ZWAgKE9yUmVzZXQpIG1ldGhvZHMgcmVzZXQgdGhlIGdlbmVyYXRvciBhbmQgcmV0dXJuIGEgbmV3IElEIGJhc2VkXG4gKiAgICBvbiB0aGUgZ2l2ZW4gYHRpbWVzdGFtcGAsIGJyZWFraW5nIHRoZSBpbmNyZWFzaW5nIG9yZGVyIG9mIElEcy5cbiAqIDIuIGBPckFib3J0YCB2YXJpYW50cyBhYm9ydCBhbmQgcmV0dXJuIGB1bmRlZmluZWRgIGltbWVkaWF0ZWx5LlxuICpcbiAqIFRoZSBgQ29yZWAgZnVuY3Rpb25zIG9mZmVyIGxvdy1sZXZlbCBwcmltaXRpdmVzIHRvIGN1c3RvbWl6ZSB0aGUgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBjbGFzcyBTY3J1MTI4R2VuZXJhdG9yIHtcbiAgcHJpdmF0ZSB0aW1lc3RhbXAgPSAwO1xuICBwcml2YXRlIGNvdW50ZXJIaSA9IDA7XG4gIHByaXZhdGUgY291bnRlckxvID0gMDtcblxuICAvKiogVGhlIHRpbWVzdGFtcCBhdCB0aGUgbGFzdCByZW5ld2FsIG9mIGBjb3VudGVyX2hpYCBmaWVsZC4gKi9cbiAgcHJpdmF0ZSB0c0NvdW50ZXJIaSA9IDA7XG5cbiAgLyoqIFRoZSByYW5kb20gbnVtYmVyIGdlbmVyYXRvciB1c2VkIGJ5IHRoZSBnZW5lcmF0b3IuICovXG4gIHByaXZhdGUgcm5nOiB7IG5leHRVaW50MzIoKTogbnVtYmVyIH07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBnZW5lcmF0b3Igb2JqZWN0IHdpdGggdGhlIGRlZmF1bHQgcmFuZG9tIG51bWJlciBnZW5lcmF0b3IsIG9yXG4gICAqIHdpdGggdGhlIHNwZWNpZmllZCBvbmUgaWYgcGFzc2VkIGFzIGFuIGFyZ3VtZW50LiBUaGUgc3BlY2lmaWVkIHJhbmRvbVxuICAgKiBudW1iZXIgZ2VuZXJhdG9yIHNob3VsZCBiZSBjcnlwdG9ncmFwaGljYWxseSBzdHJvbmcgYW5kIHNlY3VyZWx5IHNlZWRlZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHJhbmRvbU51bWJlckdlbmVyYXRvcj86IHtcbiAgICAvKiogUmV0dXJucyBhIDMyLWJpdCByYW5kb20gdW5zaWduZWQgaW50ZWdlci4gKi9cbiAgICBuZXh0VWludDMyKCk6IG51bWJlcjtcbiAgfSkge1xuICAgIHRoaXMucm5nID0gcmFuZG9tTnVtYmVyR2VuZXJhdG9yIHx8IGdldERlZmF1bHRSYW5kb20oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBuZXcgU0NSVTEyOCBJRCBvYmplY3QgZnJvbSB0aGUgY3VycmVudCBgdGltZXN0YW1wYCwgb3IgcmVzZXRzXG4gICAqIHRoZSBnZW5lcmF0b3IgdXBvbiBzaWduaWZpY2FudCB0aW1lc3RhbXAgcm9sbGJhY2suXG4gICAqXG4gICAqIFNlZSB0aGUge0BsaW5rIFNjcnUxMjhHZW5lcmF0b3J9IGNsYXNzIGRvY3VtZW50YXRpb24gZm9yIHRoZSBkZXNjcmlwdGlvbi5cbiAgICovXG4gIGdlbmVyYXRlKCk6IFNjcnUxMjhJZCB7XG4gICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVPclJlc2V0Q29yZShEYXRlLm5vdygpLCBERUZBVUxUX1JPTExCQUNLX0FMTE9XQU5DRSk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgbmV3IFNDUlUxMjggSUQgb2JqZWN0IGZyb20gdGhlIGN1cnJlbnQgYHRpbWVzdGFtcGAsIG9yIHJldHVybnNcbiAgICogYHVuZGVmaW5lZGAgdXBvbiBzaWduaWZpY2FudCB0aW1lc3RhbXAgcm9sbGJhY2suXG4gICAqXG4gICAqIFNlZSB0aGUge0BsaW5rIFNjcnUxMjhHZW5lcmF0b3J9IGNsYXNzIGRvY3VtZW50YXRpb24gZm9yIHRoZSBkZXNjcmlwdGlvbi5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBpbXBvcnQgeyBTY3J1MTI4R2VuZXJhdG9yIH0gZnJvbSBcInNjcnUxMjhcIjtcbiAgICpcbiAgICogY29uc3QgZyA9IG5ldyBTY3J1MTI4R2VuZXJhdG9yKCk7XG4gICAqIGNvbnN0IHggPSBnLmdlbmVyYXRlT3JBYm9ydCgpO1xuICAgKiBjb25zdCB5ID0gZy5nZW5lcmF0ZU9yQWJvcnQoKTtcbiAgICogaWYgKHkgPT09IHVuZGVmaW5lZCkge1xuICAgKiAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBjbG9jayB3ZW50IGJhY2t3YXJkcyBieSB0ZW4gc2Vjb25kcyFcIik7XG4gICAqIH1cbiAgICogY29uc29sZS5hc3NlcnQoeC5jb21wYXJlVG8oeSkgPCAwKTtcbiAgICogYGBgXG4gICAqL1xuICBnZW5lcmF0ZU9yQWJvcnQoKTogU2NydTEyOElkIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZU9yQWJvcnRDb3JlKERhdGUubm93KCksIERFRkFVTFRfUk9MTEJBQ0tfQUxMT1dBTkNFKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBuZXcgU0NSVTEyOCBJRCBvYmplY3QgZnJvbSB0aGUgYHRpbWVzdGFtcGAgcGFzc2VkLCBvciByZXNldHNcbiAgICogdGhlIGdlbmVyYXRvciB1cG9uIHNpZ25pZmljYW50IHRpbWVzdGFtcCByb2xsYmFjay5cbiAgICpcbiAgICogU2VlIHRoZSB7QGxpbmsgU2NydTEyOEdlbmVyYXRvcn0gY2xhc3MgZG9jdW1lbnRhdGlvbiBmb3IgdGhlIGRlc2NyaXB0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sbGJhY2tBbGxvd2FuY2UgLSBUaGUgYW1vdW50IG9mIGB0aW1lc3RhbXBgIHJvbGxiYWNrIHRoYXQgaXNcbiAgICogY29uc2lkZXJlZCBzaWduaWZpY2FudC4gQSBzdWdnZXN0ZWQgdmFsdWUgaXMgYDEwXzAwMGAgKG1pbGxpc2Vjb25kcykuXG4gICAqIEB0aHJvd3MgUmFuZ2VFcnJvciBpZiBgdGltZXN0YW1wYCBpcyBub3QgYSA0OC1iaXQgcG9zaXRpdmUgaW50ZWdlci5cbiAgICovXG4gIGdlbmVyYXRlT3JSZXNldENvcmUodGltZXN0YW1wOiBudW1iZXIsIHJvbGxiYWNrQWxsb3dhbmNlOiBudW1iZXIpOiBTY3J1MTI4SWQge1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuZ2VuZXJhdGVPckFib3J0Q29yZSh0aW1lc3RhbXAsIHJvbGxiYWNrQWxsb3dhbmNlKTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gcmVzZXQgc3RhdGUgYW5kIHJlc3VtZVxuICAgICAgdGhpcy50aW1lc3RhbXAgPSAwO1xuICAgICAgdGhpcy50c0NvdW50ZXJIaSA9IDA7XG4gICAgICB2YWx1ZSA9IHRoaXMuZ2VuZXJhdGVPckFib3J0Q29yZSh0aW1lc3RhbXAsIHJvbGxiYWNrQWxsb3dhbmNlKSE7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBuZXcgU0NSVTEyOCBJRCBvYmplY3QgZnJvbSB0aGUgYHRpbWVzdGFtcGAgcGFzc2VkLCBvciByZXR1cm5zXG4gICAqIGB1bmRlZmluZWRgIHVwb24gc2lnbmlmaWNhbnQgdGltZXN0YW1wIHJvbGxiYWNrLlxuICAgKlxuICAgKiBTZWUgdGhlIHtAbGluayBTY3J1MTI4R2VuZXJhdG9yfSBjbGFzcyBkb2N1bWVudGF0aW9uIGZvciB0aGUgZGVzY3JpcHRpb24uXG4gICAqXG4gICAqIEBwYXJhbSByb2xsYmFja0FsbG93YW5jZSAtIFRoZSBhbW91bnQgb2YgYHRpbWVzdGFtcGAgcm9sbGJhY2sgdGhhdCBpc1xuICAgKiBjb25zaWRlcmVkIHNpZ25pZmljYW50LiBBIHN1Z2dlc3RlZCB2YWx1ZSBpcyBgMTBfMDAwYCAobWlsbGlzZWNvbmRzKS5cbiAgICogQHRocm93cyBSYW5nZUVycm9yIGlmIGB0aW1lc3RhbXBgIGlzIG5vdCBhIDQ4LWJpdCBwb3NpdGl2ZSBpbnRlZ2VyLlxuICAgKi9cbiAgZ2VuZXJhdGVPckFib3J0Q29yZShcbiAgICB0aW1lc3RhbXA6IG51bWJlcixcbiAgICByb2xsYmFja0FsbG93YW5jZTogbnVtYmVyLFxuICApOiBTY3J1MTI4SWQgfCB1bmRlZmluZWQge1xuICAgIGlmIChcbiAgICAgICFOdW1iZXIuaXNJbnRlZ2VyKHRpbWVzdGFtcCkgfHxcbiAgICAgIHRpbWVzdGFtcCA8IDEgfHxcbiAgICAgIHRpbWVzdGFtcCA+IE1BWF9USU1FU1RBTVBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFwiYHRpbWVzdGFtcGAgbXVzdCBiZSBhIDQ4LWJpdCBwb3NpdGl2ZSBpbnRlZ2VyXCIpO1xuICAgIH0gZWxzZSBpZiAocm9sbGJhY2tBbGxvd2FuY2UgPCAwIHx8IHJvbGxiYWNrQWxsb3dhbmNlID4gTUFYX1RJTUVTVEFNUCkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJgcm9sbGJhY2tBbGxvd2FuY2VgIG91dCBvZiByZWFzb25hYmxlIHJhbmdlXCIpO1xuICAgIH1cblxuICAgIGlmICh0aW1lc3RhbXAgPiB0aGlzLnRpbWVzdGFtcCkge1xuICAgICAgdGhpcy50aW1lc3RhbXAgPSB0aW1lc3RhbXA7XG4gICAgICB0aGlzLmNvdW50ZXJMbyA9IHRoaXMucm5nLm5leHRVaW50MzIoKSAmIE1BWF9DT1VOVEVSX0xPO1xuICAgIH0gZWxzZSBpZiAodGltZXN0YW1wICsgcm9sbGJhY2tBbGxvd2FuY2UgPj0gdGhpcy50aW1lc3RhbXApIHtcbiAgICAgIC8vIGdvIG9uIHdpdGggcHJldmlvdXMgdGltZXN0YW1wIGlmIG5ldyBvbmUgaXMgbm90IG11Y2ggc21hbGxlclxuICAgICAgdGhpcy5jb3VudGVyTG8rKztcbiAgICAgIGlmICh0aGlzLmNvdW50ZXJMbyA+IE1BWF9DT1VOVEVSX0xPKSB7XG4gICAgICAgIHRoaXMuY291bnRlckxvID0gMDtcbiAgICAgICAgdGhpcy5jb3VudGVySGkrKztcbiAgICAgICAgaWYgKHRoaXMuY291bnRlckhpID4gTUFYX0NPVU5URVJfSEkpIHtcbiAgICAgICAgICB0aGlzLmNvdW50ZXJIaSA9IDA7XG4gICAgICAgICAgLy8gaW5jcmVtZW50IHRpbWVzdGFtcCBhdCBjb3VudGVyIG92ZXJmbG93XG4gICAgICAgICAgdGhpcy50aW1lc3RhbXArKztcbiAgICAgICAgICB0aGlzLmNvdW50ZXJMbyA9IHRoaXMucm5nLm5leHRVaW50MzIoKSAmIE1BWF9DT1VOVEVSX0xPO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGFib3J0IGlmIGNsb2NrIHdlbnQgYmFja3dhcmRzIHRvIHVuYmVhcmFibGUgZXh0ZW50XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRpbWVzdGFtcCAtIHRoaXMudHNDb3VudGVySGkgPj0gMV8wMDAgfHwgdGhpcy50c0NvdW50ZXJIaSA8IDEpIHtcbiAgICAgIHRoaXMudHNDb3VudGVySGkgPSB0aGlzLnRpbWVzdGFtcDtcbiAgICAgIHRoaXMuY291bnRlckhpID0gdGhpcy5ybmcubmV4dFVpbnQzMigpICYgTUFYX0NPVU5URVJfSEk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFNjcnUxMjhJZC5mcm9tRmllbGRzKFxuICAgICAgdGhpcy50aW1lc3RhbXAsXG4gICAgICB0aGlzLmNvdW50ZXJIaSxcbiAgICAgIHRoaXMuY291bnRlckxvLFxuICAgICAgdGhpcy5ybmcubmV4dFVpbnQzMigpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBpbmZpbml0ZSBpdGVyYXRvciBvYmplY3QgdGhhdCBwcm9kdWNlcyBhIG5ldyBJRCBmb3IgZWFjaCBjYWxsIG9mXG4gICAqIGBuZXh0KClgLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIGltcG9ydCB7IFNjcnUxMjhHZW5lcmF0b3IgfSBmcm9tIFwic2NydTEyOFwiO1xuICAgKlxuICAgKiBjb25zdCBbYSwgYiwgY10gPSBuZXcgU2NydTEyOEdlbmVyYXRvcigpO1xuICAgKiBjb25zb2xlLmxvZyhTdHJpbmcoYSkpOyAvLyBlLmcuLCBcIjAzOG1xcjllMTRjamMxMmRoOWFtdzdpNW9cIlxuICAgKiBjb25zb2xlLmxvZyhTdHJpbmcoYikpOyAvLyBlLmcuLCBcIjAzOG1xcjllMTRjamMxMmRoOWR0cHdmcjNcIlxuICAgKiBjb25zb2xlLmxvZyhTdHJpbmcoYykpOyAvLyBlLmcuLCBcIjAzOG1xcjllMTRjamMxMmRoOWU2cmptcWlcIlxuICAgKiBgYGBcbiAgICovXG4gIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhdG9yPFNjcnUxMjhJZCwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBTQ1JVMTI4IElEIG9iamVjdCBmb3IgZWFjaCBjYWxsLCBpbmZpbml0ZWx5LlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCB3cmFwcyB0aGUgcmVzdWx0IG9mIHtAbGluayBnZW5lcmF0ZX0gaW4gYW4gW2BJdGVyYXRvclJlc3VsdGBdXG4gICAqIG9iamVjdCB0byB1c2UgYHRoaXNgIGFzIGFuIGluZmluaXRlIGl0ZXJhdG9yLlxuICAgKlxuICAgKiBbYEl0ZXJhdG9yUmVzdWx0YF06IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0l0ZXJhdGlvbl9wcm90b2NvbHNcbiAgICovXG4gIG5leHQoKTogSXRlcmF0b3JSZXN1bHQ8U2NydTEyOElkLCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4geyB2YWx1ZTogdGhpcy5nZW5lcmF0ZSgpLCBkb25lOiBmYWxzZSB9O1xuICB9XG59XG5cbi8qKiBBIGdsb2JhbCBmbGFnIHRvIGZvcmNlIHVzZSBvZiBjcnlwdG9ncmFwaGljYWxseSBzdHJvbmcgUk5HLiAqL1xuZGVjbGFyZSBjb25zdCBTQ1JVMTI4X0RFTllfV0VBS19STkc6IGJvb2xlYW47XG5cbi8qKiBSZXR1cm5zIHRoZSBkZWZhdWx0IHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIGF2YWlsYWJsZSBpbiB0aGUgZW52aXJvbm1lbnQuICovXG5jb25zdCBnZXREZWZhdWx0UmFuZG9tID0gKCk6IHsgbmV4dFVpbnQzMigpOiBudW1iZXIgfSA9PiB7XG4gIC8vIGRldGVjdCBXZWIgQ3J5cHRvIEFQSVxuICBpZiAoXG4gICAgdHlwZW9mIGNyeXB0byAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHR5cGVvZiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzICE9PSBcInVuZGVmaW5lZFwiXG4gICkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyZWRDcnlwdG9SYW5kb20oKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBmYWxsIGJhY2sgb24gTWF0aC5yYW5kb20oKSB1bmxlc3MgdGhlIGZsYWcgaXMgc2V0IHRvIHRydWVcbiAgICBpZiAodHlwZW9mIFNDUlUxMjhfREVOWV9XRUFLX1JORyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBTQ1JVMTI4X0RFTllfV0VBS19STkcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vIGNyeXB0b2dyYXBoaWNhbGx5IHN0cm9uZyBSTkcgYXZhaWxhYmxlXCIpO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgbmV4dFVpbnQzMjogKCk6IG51bWJlciA9PlxuICAgICAgICBNYXRoLnRydW5jKE1hdGgucmFuZG9tKCkgKiAweDFfMDAwMCkgKiAweDFfMDAwMCArXG4gICAgICAgIE1hdGgudHJ1bmMoTWF0aC5yYW5kb20oKSAqIDB4MV8wMDAwKSxcbiAgICB9O1xuICB9XG59O1xuXG4vKipcbiAqIFdyYXBzIGBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKClgIHRvIGVuYWJsZSBidWZmZXJpbmc7IHRoaXMgdXNlcyBhIHNtYWxsXG4gKiBidWZmZXIgYnkgZGVmYXVsdCB0byBhdm9pZCBib3RoIHVuYmVhcmFibGUgdGhyb3VnaHB1dCBkZWNsaW5lIGluIHNvbWVcbiAqIGVudmlyb25tZW50cyBhbmQgdGhlIHdhc3RlIG9mIHRpbWUgYW5kIHNwYWNlIGZvciB1bnVzZWQgdmFsdWVzLlxuICovXG5jbGFzcyBCdWZmZXJlZENyeXB0b1JhbmRvbSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KDgpO1xuICBwcml2YXRlIGN1cnNvciA9IDB4ZmZmZjtcbiAgbmV4dFVpbnQzMigpOiBudW1iZXIge1xuICAgIGlmICh0aGlzLmN1cnNvciA+PSB0aGlzLmJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXModGhpcy5idWZmZXIpO1xuICAgICAgdGhpcy5jdXJzb3IgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWZmZXJbdGhpcy5jdXJzb3IrK107XG4gIH1cbn1cblxubGV0IGdsb2JhbEdlbmVyYXRvcjogU2NydTEyOEdlbmVyYXRvciB8IHVuZGVmaW5lZDtcblxuLyoqIEdlbmVyYXRlcyBhIG5ldyBTQ1JVMTI4IElEIG9iamVjdCB1c2luZyB0aGUgZ2xvYmFsIGdlbmVyYXRvci4gKi9cbmV4cG9ydCBjb25zdCBzY3J1MTI4ID0gKCk6IFNjcnUxMjhJZCA9PlxuICAoZ2xvYmFsR2VuZXJhdG9yIHx8IChnbG9iYWxHZW5lcmF0b3IgPSBuZXcgU2NydTEyOEdlbmVyYXRvcigpKSkuZ2VuZXJhdGUoKTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBuZXcgU0NSVTEyOCBJRCBlbmNvZGVkIGluIGEgc3RyaW5nIHVzaW5nIHRoZSBnbG9iYWwgZ2VuZXJhdG9yLlxuICpcbiAqIFVzZSB0aGlzIGZ1bmN0aW9uIHRvIHF1aWNrbHkgZ2V0IGEgbmV3IFNDUlUxMjggSUQgYXMgYSBzdHJpbmcuXG4gKlxuICogQHJldHVybnMgVGhlIDI1LWRpZ2l0IGNhbm9uaWNhbCBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gKiBAZXhhbXBsZVxuICogYGBgamF2YXNjcmlwdFxuICogaW1wb3J0IHsgc2NydTEyOFN0cmluZyB9IGZyb20gXCJzY3J1MTI4XCI7XG4gKlxuICogY29uc3QgeCA9IHNjcnUxMjhTdHJpbmcoKTtcbiAqIGNvbnNvbGUubG9nKHgpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBzY3J1MTI4U3RyaW5nID0gKCk6IHN0cmluZyA9PiBzY3J1MTI4KCkudG9TdHJpbmcoKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7QUFzQkEsSUFBTSxnQkFBZ0I7QUFHdEIsSUFBTSxpQkFBaUI7QUFHdkIsSUFBTSxpQkFBaUI7QUFHdkIsSUFBTSxTQUFTO0FBR2YsSUFBTSxhQUFhO0FBQUEsRUFDakI7QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUN4RTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQ3hFO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFDeEU7QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUN4RTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQ3hFO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFDeEU7QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUN4RTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQ3hFO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFDeEU7QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQzlEO0FBR0EsSUFBTSw2QkFBNkI7QUFnQjVCLElBQU0sYUFBTixNQUFNLFdBQVU7QUFBQTtBQUFBLEVBUWIsWUFBWSxPQUE2QjtBQUMvQyxTQUFLLFFBQVE7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLE9BQU8sUUFBUSxPQUFtQjtBQUNoQyxRQUFJLE1BQU0sV0FBVyxJQUFJO0FBQ3ZCLGFBQU8sSUFBSSxXQUFVLEtBQUs7QUFBQSxJQUM1QixPQUFPO0FBQ0wsWUFBTSxJQUFJO0FBQUEsUUFDUixtQ0FDRSxNQUFNLFNBQ047QUFBQSxNQUNKO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsT0FBTyxXQUNMLFdBQ0EsV0FDQSxXQUNBLFNBQ1c7QUFDWCxRQUNFLENBQUMsT0FBTyxVQUFVLFNBQVMsS0FDM0IsQ0FBQyxPQUFPLFVBQVUsU0FBUyxLQUMzQixDQUFDLE9BQU8sVUFBVSxTQUFTLEtBQzNCLENBQUMsT0FBTyxVQUFVLE9BQU8sS0FDekIsWUFBWSxLQUNaLFlBQVksS0FDWixZQUFZLEtBQ1osVUFBVSxLQUNWLFlBQVksaUJBQ1osWUFBWSxrQkFDWixZQUFZLGtCQUNaLFVBQVUsWUFDVjtBQUNBLFlBQU0sSUFBSSxXQUFXLHFCQUFxQjtBQUFBLElBQzVDO0FBRUEsVUFBTSxRQUFRLElBQUksV0FBVyxFQUFFO0FBQy9CLFVBQU0sQ0FBQyxJQUFJLFlBQVk7QUFDdkIsVUFBTSxDQUFDLElBQUksWUFBWTtBQUN2QixVQUFNLENBQUMsSUFBSSxjQUFjO0FBQ3pCLFVBQU0sQ0FBQyxJQUFJLGNBQWM7QUFDekIsVUFBTSxDQUFDLElBQUksY0FBYztBQUN6QixVQUFNLENBQUMsSUFBSTtBQUNYLFVBQU0sQ0FBQyxJQUFJLGNBQWM7QUFDekIsVUFBTSxDQUFDLElBQUksY0FBYztBQUN6QixVQUFNLENBQUMsSUFBSTtBQUNYLFVBQU0sQ0FBQyxJQUFJLGNBQWM7QUFDekIsVUFBTSxFQUFFLElBQUksY0FBYztBQUMxQixVQUFNLEVBQUUsSUFBSTtBQUNaLFVBQU0sRUFBRSxJQUFJLFlBQVk7QUFDeEIsVUFBTSxFQUFFLElBQUksWUFBWTtBQUN4QixVQUFNLEVBQUUsSUFBSSxZQUFZO0FBQ3hCLFVBQU0sRUFBRSxJQUFJO0FBQ1osV0FBTyxJQUFJLFdBQVUsS0FBSztBQUFBLEVBQzVCO0FBQUE7QUFBQSxFQUdBLElBQUksWUFBb0I7QUFDdEIsV0FBTyxLQUFLLFFBQVEsR0FBRyxDQUFDO0FBQUEsRUFDMUI7QUFBQTtBQUFBLEVBR0EsSUFBSSxZQUFvQjtBQUN0QixXQUFPLEtBQUssUUFBUSxHQUFHLENBQUM7QUFBQSxFQUMxQjtBQUFBO0FBQUEsRUFHQSxJQUFJLFlBQW9CO0FBQ3RCLFdBQU8sS0FBSyxRQUFRLEdBQUcsRUFBRTtBQUFBLEVBQzNCO0FBQUE7QUFBQSxFQUdBLElBQUksVUFBa0I7QUFDcEIsV0FBTyxLQUFLLFFBQVEsSUFBSSxFQUFFO0FBQUEsRUFDNUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU8sV0FBVyxPQUEwQjtBQWpMOUM7QUFrTEksUUFBSSxNQUFNLFdBQVcsSUFBSTtBQUN2QixZQUFNLElBQUk7QUFBQSxRQUNSLHFCQUFxQixNQUFNLFNBQVM7QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFFQSxVQUFNLE1BQU0sSUFBSSxXQUFXLEVBQUU7QUFDN0IsYUFBUyxJQUFJLEdBQUcsSUFBSSxJQUFJLEtBQUs7QUFDM0IsVUFBSSxDQUFDLEtBQUksZ0JBQVcsTUFBTSxXQUFXLENBQUMsQ0FBQyxNQUE5QixZQUFtQztBQUM1QyxVQUFJLElBQUksQ0FBQyxLQUFLLEtBQU07QUFDbEIsY0FBTSxJQUFJLE9BQU8sY0FBYyxNQUFNLFlBQVksQ0FBQyxDQUFFO0FBQ3BELGNBQU0sSUFBSSxZQUFZLG9CQUFvQixJQUFJLFVBQVUsQ0FBQztBQUFBLE1BQzNEO0FBQUEsSUFDRjtBQUVBLFdBQU8sV0FBVSxnQkFBZ0IsR0FBRztBQUFBLEVBQ3RDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBZSxnQkFBZ0IsS0FBbUM7QUFDaEUsUUFBSSxJQUFJLFdBQVcsSUFBSTtBQUNyQixZQUFNLElBQUksWUFBWSxxQkFBcUIsSUFBSSxTQUFTLGdCQUFnQjtBQUFBLElBQzFFO0FBRUEsVUFBTSxNQUFNLElBQUksV0FBVyxFQUFFO0FBQzdCLFFBQUksV0FBVztBQUNmLGFBQVMsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLEdBQUc7QUFFL0IsVUFBSSxRQUFRO0FBQ1osZUFBU0EsS0FBSSxJQUFJLElBQUksSUFBSSxHQUFHQSxLQUFJLElBQUksR0FBR0EsTUFBSztBQUMxQyxjQUFNLElBQUksSUFBSUEsRUFBQztBQUNmLFlBQUksSUFBSSxLQUFLLElBQUksTUFBTSxDQUFDLE9BQU8sVUFBVSxDQUFDLEdBQUc7QUFDM0MsZ0JBQU0sSUFBSSxZQUFZLHNCQUFzQkEsRUFBQztBQUFBLFFBQy9DO0FBQ0EsZ0JBQVEsUUFBUSxLQUFLO0FBQUEsTUFDdkI7QUFJQSxVQUFJLElBQUksSUFBSSxTQUFTO0FBQ3JCLGFBQU8sUUFBUSxLQUFLLElBQUksVUFBVSxLQUFLO0FBQ3JDLFlBQUksSUFBSSxHQUFHO0FBQ1QsZ0JBQU0sSUFBSSxZQUFZLDRCQUE0QjtBQUFBLFFBQ3BEO0FBQ0EsaUJBQVMsSUFBSSxDQUFDLElBQUk7QUFDbEIsY0FBTSxNQUFNLEtBQUssTUFBTSxRQUFRLEdBQUs7QUFDcEMsWUFBSSxDQUFDLElBQUksUUFBUTtBQUNqQixnQkFBUTtBQUFBLE1BQ1Y7QUFDQSxpQkFBVztBQUFBLElBQ2I7QUFFQSxXQUFPLElBQUksV0FBVSxHQUFHO0FBQUEsRUFDMUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxXQUFtQjtBQUNqQixVQUFNLE1BQU0sSUFBSSxXQUFXLEVBQUU7QUFDN0IsUUFBSSxXQUFXO0FBQ2YsYUFBUyxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssR0FBRztBQUUvQixVQUFJLFFBQVEsS0FBSyxRQUFRLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBSTdDLFVBQUksSUFBSSxJQUFJLFNBQVM7QUFDckIsYUFBTyxRQUFRLEtBQUssSUFBSSxVQUFVLEtBQUs7QUFFckMsaUJBQVMsSUFBSSxDQUFDLElBQUk7QUFDbEIsY0FBTSxNQUFNLEtBQUssTUFBTSxRQUFRLEVBQUU7QUFDakMsWUFBSSxDQUFDLElBQUksUUFBUSxNQUFNO0FBQ3ZCLGdCQUFRO0FBQUEsTUFDVjtBQUNBLGlCQUFXO0FBQUEsSUFDYjtBQUVBLFFBQUksT0FBTztBQUNYLGVBQVcsS0FBSyxLQUFLO0FBQ25CLGNBQVEsT0FBTyxPQUFPLENBQUM7QUFBQSxJQUN6QjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWVBLE9BQU8sVUFBVSxPQUFxQztBQUNwRCxhQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sUUFBUSxLQUFLO0FBQ3JDLFlBQU0sSUFBSSxNQUFNLENBQUM7QUFDakIsVUFBSSxJQUFJLEtBQUssSUFBSSxPQUFRLENBQUMsT0FBTyxVQUFVLENBQUMsR0FBRztBQUM3QyxjQUFNLElBQUksWUFBWSx3QkFBd0IsSUFBSSxTQUFTLENBQUM7QUFBQSxNQUM5RDtBQUFBLElBQ0Y7QUFDQSxRQUFJLE1BQU0sV0FBVyxJQUFJO0FBQ3ZCLGFBQU8sSUFBSSxXQUFVLFdBQVcsS0FBSyxLQUFLLENBQUM7QUFBQSxJQUM3QyxXQUFXLE1BQU0sV0FBVyxJQUFJO0FBQzlCLGFBQU8sV0FBVTtBQUFBLFFBQ2YsV0FBVyxLQUFLLE9BQU8sQ0FBQyxNQUFHO0FBeFNuQztBQXdTc0Msa0NBQVcsQ0FBQyxNQUFaLFlBQWlCO0FBQUEsU0FBSTtBQUFBLE1BQ3JEO0FBQUEsSUFDRixPQUFPO0FBQ0wsWUFBTSxJQUFJO0FBQUEsUUFDUixtQ0FBbUMsTUFBTSxTQUFTO0FBQUEsTUFDcEQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxPQUFPLFdBQVcsT0FBMEI7QUFDMUMsUUFBSSxRQUFRLEtBQUssU0FBUyxPQUFPLEdBQUcsSUFBSSxHQUFHO0FBQ3pDLFlBQU0sSUFBSSxXQUFXLDRCQUE0QjtBQUFBLElBQ25EO0FBQ0EsVUFBTSxRQUFRLElBQUksV0FBVyxFQUFFO0FBQy9CLGFBQVMsSUFBSSxJQUFJLEtBQUssR0FBRyxLQUFLO0FBQzVCLFlBQU0sQ0FBQyxJQUFJLE9BQU8sUUFBUSxPQUFPLEdBQUksQ0FBQztBQUN0QyxnQkFBVSxPQUFPLENBQUM7QUFBQSxJQUNwQjtBQUNBLFdBQU8sSUFBSSxXQUFVLEtBQUs7QUFBQSxFQUM1QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLFdBQW1CO0FBQ2pCLFdBQU8sS0FBSyxNQUFNO0FBQUEsTUFDaEIsQ0FBQyxLQUFLLFNBQVUsT0FBTyxPQUFPLENBQUMsSUFBSyxPQUFPLElBQUk7QUFBQSxNQUMvQyxPQUFPLENBQUM7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQU8sUUFBUSxPQUEwQjtBQUN2QyxVQUFNLElBQUksTUFBTSxNQUFNLG1DQUFtQztBQUN6RCxRQUFJLE1BQU0sUUFBUSxFQUFFLENBQUMsRUFBRSxTQUFTLElBQUk7QUFDbEMsWUFBTSxJQUFJLFlBQVksNkJBQTZCO0FBQUEsSUFDckQ7QUFFQSxVQUFNLE1BQU0sS0FBSyxFQUFFLENBQUMsRUFBRTtBQUN0QixVQUFNLFFBQVEsSUFBSSxXQUFXLEVBQUU7QUFDL0IsYUFBUyxJQUFJLEdBQUcsSUFBSSxJQUFJLEtBQUs7QUFDM0IsWUFBTSxNQUFNLElBQUksSUFBSTtBQUNwQixZQUFNLENBQUMsS0FDSixNQUFNLElBQUksSUFBSSxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsR0FBRyxDQUFDLEtBQUssTUFDbEQsTUFBTSxJQUFJLElBQUksSUFBSSxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxJQUMxRDtBQUNBLFdBQU8sSUFBSSxXQUFVLEtBQUs7QUFBQSxFQUM1QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsUUFBZ0I7QUFDZCxVQUFNLFNBQVM7QUFDZixRQUFJLE9BQU87QUFDWCxlQUFXLEtBQUssS0FBSyxPQUFPO0FBQzFCLGNBQVEsT0FBTyxPQUFPLE1BQU0sQ0FBQztBQUM3QixjQUFRLE9BQU8sT0FBTyxJQUFJLEVBQUc7QUFBQSxJQUMvQjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQSxFQUdBLFNBQWlCO0FBQ2YsV0FBTyxLQUFLLFNBQVM7QUFBQSxFQUN2QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsUUFBbUI7QUFDakIsV0FBTyxJQUFJLFdBQVUsS0FBSyxNQUFNLE1BQU0sQ0FBQyxDQUFDO0FBQUEsRUFDMUM7QUFBQTtBQUFBLEVBR0EsT0FBTyxPQUEyQjtBQUNoQyxXQUFPLEtBQUssVUFBVSxLQUFLLE1BQU07QUFBQSxFQUNuQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxVQUFVLE9BQTBCO0FBQ2xDLGFBQVMsSUFBSSxHQUFHLElBQUksSUFBSSxLQUFLO0FBQzNCLFlBQU0sT0FBTyxLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQzFDLFVBQUksU0FBUyxHQUFHO0FBQ2QsZUFBTyxLQUFLLEtBQUssSUFBSTtBQUFBLE1BQ3ZCO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQSxFQUdRLFFBQVEsWUFBb0IsVUFBMEI7QUFDNUQsUUFBSSxTQUFTO0FBQ2IsV0FBTyxhQUFhLFVBQVU7QUFDNUIsZUFBUyxTQUFTLE1BQVEsS0FBSyxNQUFNLFlBQVk7QUFBQSxJQUNuRDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFuV3VCO0FBQWhCLElBQU0sWUFBTjtBQXdZQSxJQUFNLG9CQUFOLE1BQU0sa0JBQWlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBZ0I1QixZQUFZLHVCQUdUO0FBbEJILFNBQVEsWUFBWTtBQUNwQixTQUFRLFlBQVk7QUFDcEIsU0FBUSxZQUFZO0FBR3BCO0FBQUEsU0FBUSxjQUFjO0FBY3BCLFNBQUssTUFBTSx5QkFBeUIsaUJBQWlCO0FBQUEsRUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFdBQXNCO0FBQ3BCLFdBQU8sS0FBSyxvQkFBb0IsS0FBSyxJQUFJLEdBQUcsMEJBQTBCO0FBQUEsRUFDeEU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBcUJBLGtCQUF5QztBQUN2QyxXQUFPLEtBQUssb0JBQW9CLEtBQUssSUFBSSxHQUFHLDBCQUEwQjtBQUFBLEVBQ3hFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLG9CQUFvQixXQUFtQixtQkFBc0M7QUFDM0UsUUFBSSxRQUFRLEtBQUssb0JBQW9CLFdBQVcsaUJBQWlCO0FBQ2pFLFFBQUksVUFBVSxRQUFXO0FBRXZCLFdBQUssWUFBWTtBQUNqQixXQUFLLGNBQWM7QUFDbkIsY0FBUSxLQUFLLG9CQUFvQixXQUFXLGlCQUFpQjtBQUFBLElBQy9EO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsb0JBQ0UsV0FDQSxtQkFDdUI7QUFDdkIsUUFDRSxDQUFDLE9BQU8sVUFBVSxTQUFTLEtBQzNCLFlBQVksS0FDWixZQUFZLGVBQ1o7QUFDQSxZQUFNLElBQUksV0FBVywrQ0FBK0M7QUFBQSxJQUN0RSxXQUFXLG9CQUFvQixLQUFLLG9CQUFvQixlQUFlO0FBQ3JFLFlBQU0sSUFBSSxXQUFXLDZDQUE2QztBQUFBLElBQ3BFO0FBRUEsUUFBSSxZQUFZLEtBQUssV0FBVztBQUM5QixXQUFLLFlBQVk7QUFDakIsV0FBSyxZQUFZLEtBQUssSUFBSSxXQUFXLElBQUk7QUFBQSxJQUMzQyxXQUFXLFlBQVkscUJBQXFCLEtBQUssV0FBVztBQUUxRCxXQUFLO0FBQ0wsVUFBSSxLQUFLLFlBQVksZ0JBQWdCO0FBQ25DLGFBQUssWUFBWTtBQUNqQixhQUFLO0FBQ0wsWUFBSSxLQUFLLFlBQVksZ0JBQWdCO0FBQ25DLGVBQUssWUFBWTtBQUVqQixlQUFLO0FBQ0wsZUFBSyxZQUFZLEtBQUssSUFBSSxXQUFXLElBQUk7QUFBQSxRQUMzQztBQUFBLE1BQ0Y7QUFBQSxJQUNGLE9BQU87QUFFTCxhQUFPO0FBQUEsSUFDVDtBQUVBLFFBQUksS0FBSyxZQUFZLEtBQUssZUFBZSxPQUFTLEtBQUssY0FBYyxHQUFHO0FBQ3RFLFdBQUssY0FBYyxLQUFLO0FBQ3hCLFdBQUssWUFBWSxLQUFLLElBQUksV0FBVyxJQUFJO0FBQUEsSUFDM0M7QUFFQSxXQUFPLFVBQVU7QUFBQSxNQUNmLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLEtBQUssSUFBSSxXQUFXO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBZ0JBLENBQUMsT0FBTyxRQUFRLElBQW9DO0FBQ2xELFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBNkM7QUFDM0MsV0FBTyxFQUFFLE9BQU8sS0FBSyxTQUFTLEdBQUcsTUFBTSxNQUFNO0FBQUEsRUFDL0M7QUFDRjtBQXBLOEI7QUFBdkIsSUFBTSxtQkFBTjtBQTBLUCxJQUFNLG1CQUFtQiw2QkFBZ0M7QUFFdkQsTUFDRSxPQUFPLFdBQVcsZUFDbEIsT0FBTyxPQUFPLG9CQUFvQixhQUNsQztBQUNBLFdBQU8sSUFBSSxxQkFBcUI7QUFBQSxFQUNsQyxPQUFPO0FBRUwsUUFBSSxPQUFPLDBCQUEwQixlQUFlLHVCQUF1QjtBQUN6RSxZQUFNLElBQUksTUFBTSwyQ0FBMkM7QUFBQSxJQUM3RDtBQUNBLFdBQU87QUFBQSxNQUNMLFlBQVksNkJBQ1YsS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLEtBQVEsSUFBSSxRQUN2QyxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUksS0FBUSxHQUZ6QjtBQUFBLElBR2Q7QUFBQSxFQUNGO0FBQ0YsR0FsQnlCO0FBeUJ6QixJQUFNLHdCQUFOLE1BQU0sc0JBQXFCO0FBQUEsRUFBM0I7QUFDRSxTQUFpQixTQUFTLElBQUksWUFBWSxDQUFDO0FBQzNDLFNBQVEsU0FBUztBQUFBO0FBQUEsRUFDakIsYUFBcUI7QUFDbkIsUUFBSSxLQUFLLFVBQVUsS0FBSyxPQUFPLFFBQVE7QUFDckMsYUFBTyxnQkFBZ0IsS0FBSyxNQUFNO0FBQ2xDLFdBQUssU0FBUztBQUFBLElBQ2hCO0FBQ0EsV0FBTyxLQUFLLE9BQU8sS0FBSyxRQUFRO0FBQUEsRUFDbEM7QUFDRjtBQVYyQjtBQUEzQixJQUFNLHVCQUFOO0FBWUEsSUFBSTtBQUdHLElBQU0sVUFBVSw4QkFDcEIsb0JBQW9CLGtCQUFrQixJQUFJLGlCQUFpQixJQUFJLFNBQVMsR0FEcEQ7QUFpQmhCLElBQU0sZ0JBQWdCLDZCQUFjLFFBQVEsRUFBRSxTQUFTLEdBQWpDOyIsCiAgIm5hbWVzIjogWyJqIl0KfQo=