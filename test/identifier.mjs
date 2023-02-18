import { Scru128Generator, Scru128Id } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.SCRU128_DENY_WEAK_RNG = true;

describe("Scru128Id", function () {
  const MAX_UINT48 = 2 ** 48 - 1;
  const MAX_UINT24 = 2 ** 24 - 1;
  const MAX_UINT32 = 2 ** 32 - 1;

  it("encodes and decodes prepared cases correctly", function () {
    const cases = [
      [[0, 0, 0, 0], "0000000000000000000000000"],
      [[MAX_UINT48, 0, 0, 0], "F5LXX1ZZ5K6TP71GEEH2DB7K0"],
      [[MAX_UINT48, 0, 0, 0], "f5lxx1zz5k6tp71geeh2db7k0"],
      [[0, MAX_UINT24, 0, 0], "0000000005GV2R2KJWR7N8XS0"],
      [[0, MAX_UINT24, 0, 0], "0000000005gv2r2kjwr7n8xs0"],
      [[0, 0, MAX_UINT24, 0], "00000000000000JPIA7QL4HS0"],
      [[0, 0, MAX_UINT24, 0], "00000000000000jpia7ql4hs0"],
      [[0, 0, 0, MAX_UINT32], "0000000000000000001Z141Z3"],
      [[0, 0, 0, MAX_UINT32], "0000000000000000001z141z3"],
      [
        [MAX_UINT48, MAX_UINT24, MAX_UINT24, MAX_UINT32],
        "F5LXX1ZZ5PNORYNQGLHZMSP33",
      ],
      [
        [MAX_UINT48, MAX_UINT24, MAX_UINT24, MAX_UINT32],
        "f5lxx1zz5pnorynqglhzmsp33",
      ],
    ];

    const fs = ["timestamp", "counterHi", "counterLo", "entropy"];
    for (const e of cases) {
      const fromFields = Scru128Id.fromFields(...e[0]);
      const fromString = Scru128Id.fromString(e[1]);

      assert(fromFields.equals(fromString));
      assert(fromFields.toString() === e[1].toUpperCase());
      assert(fromString.toString() === e[1].toUpperCase());
      for (let i = 0; i < fs.length; i++) {
        assert(fromFields[fs[i]] === e[0][i]);
        assert(fromString[fs[i]] === e[0][i]);
      }
    }
  });

  it("throws error if an invalid string representation is supplied", function () {
    const cases = [
      "",
      " 036Z8PUQ4TSXSIGK6O19Y164Q",
      "036Z8PUQ54QNY1VQ3HCBRKWEB ",
      " 036Z8PUQ54QNY1VQ3HELIVWAX ",
      "+036Z8PUQ54QNY1VQ3HFCV3SS0",
      "-036Z8PUQ54QNY1VQ3HHY8U1CH",
      "+36Z8PUQ54QNY1VQ3HJQ48D9P",
      "-36Z8PUQ5A7J0TI08OZ6ZDRDY",
      "036Z8PUQ5A7J0T_08P2CDZ28V",
      "036Z8PU-5A7J0TI08P3OL8OOL",
      "036Z8PUQ5A7J0TI08P4J 6CYA",
      "F5LXX1ZZ5PNORYNQGLHZMSP34",
      "ZZZZZZZZZZZZZZZZZZZZZZZZZ",
    ];

    for (const e of cases) {
      let caughtErr = null;
      try {
        Scru128Id.fromString(e);
      } catch (err) {
        caughtErr = err;
      }
      assert(caughtErr !== null);
    }
  });

  it("has symmetric converters from/to various values", function () {
    const cases = [
      Scru128Id.fromFields(0, 0, 0, 0),
      Scru128Id.fromFields(MAX_UINT48, 0, 0, 0),
      Scru128Id.fromFields(0, MAX_UINT24, 0, 0),
      Scru128Id.fromFields(0, 0, MAX_UINT24, 0),
      Scru128Id.fromFields(0, 0, 0, MAX_UINT32),
      Scru128Id.fromFields(MAX_UINT48, MAX_UINT24, MAX_UINT24, MAX_UINT32),
    ];

    const g = new Scru128Generator();
    for (let i = 0; i < 1_000; i++) {
      cases.push(g.generate());
    }

    for (const e of cases) {
      assert(Scru128Id.fromString(e.toString()).equals(e));
      assert(Scru128Id.fromHex(e.toHex()).equals(e));
      assert(
        Scru128Id.fromFields(
          e.timestamp,
          e.counterHi,
          e.counterLo,
          e.entropy
        ).equals(e)
      );

      const ofInner = Scru128Id.ofInner(e.bytes);
      assert(ofInner.equals(e));
      assert(ofInner.bytes.buffer == e.bytes.buffer);

      const fromBytes = Scru128Id.fromBytes(e.bytes);
      assert(fromBytes.equals(e));
      assert(fromBytes.bytes.buffer != e.bytes.buffer);

      const fromCharCodes = Scru128Id.fromBytes(
        Uint8Array.from(e.toString(), (c) => c.charCodeAt(0))
      );
      assert(fromCharCodes.equals(e));
      assert(fromCharCodes.bytes.buffer != e.bytes.buffer);

      const arrayBuffer = e.toArrayBuffer();
      const fromArrayBuffer = Scru128Id.fromArrayBuffer(arrayBuffer);
      assert(fromArrayBuffer.equals(e));
      assert(arrayBuffer != e.bytes.buffer);
      assert(arrayBuffer != fromArrayBuffer.bytes.buffer);
    }
  });

  it("supports comparison methods", function () {
    const ordered = [
      Scru128Id.fromFields(0, 0, 0, 0),
      Scru128Id.fromFields(0, 0, 0, 1),
      Scru128Id.fromFields(0, 0, 0, MAX_UINT32),
      Scru128Id.fromFields(0, 0, 1, 0),
      Scru128Id.fromFields(0, 0, MAX_UINT24, 0),
      Scru128Id.fromFields(0, 1, 0, 0),
      Scru128Id.fromFields(0, MAX_UINT24, 0, 0),
      Scru128Id.fromFields(1, 0, 0, 0),
      Scru128Id.fromFields(2, 0, 0, 0),
    ];

    const g = new Scru128Generator();
    for (let i = 0; i < 1_000; i++) {
      ordered.push(g.generate());
    }

    let prev = ordered.shift();
    for (const curr of ordered) {
      assert(!curr.equals(prev));
      assert(!prev.equals(curr));
      assert(curr.compareTo(prev) > 0);
      assert(prev.compareTo(curr) < 0);

      const clone = curr.clone();
      assert(curr != clone);
      assert(clone != curr);
      assert(curr.equals(clone));
      assert(clone.equals(curr));
      assert(curr.compareTo(clone) === 0);
      assert(clone.compareTo(curr) === 0);
      assert(curr.bytes.buffer != clone.bytes.buffer);
      assert(clone.bytes.buffer != curr.bytes.buffer);

      prev = curr;
    }
  });

  it("serializes an object using the canonical string representation", function () {
    const g = new Scru128Generator();
    for (let i = 0; i < 1_000; i++) {
      const obj = g.generate();
      assert(JSON.stringify(obj) === `"${obj}"`);
    }
  });
});
