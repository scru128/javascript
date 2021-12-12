import { Scru128Generator, Scru128Id } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

describe("Scru128Id", function () {
  const MAX_UINT44 = 2 ** 44 - 1;
  const MAX_UINT28 = 2 ** 28 - 1;
  const MAX_UINT24 = 2 ** 24 - 1;
  const MAX_UINT32 = 2 ** 32 - 1;

  it("encodes and decodes prepared cases correctly", function () {
    const cases = [
      [[0, 0, 0, 0], "00000000000000000000000000"],
      [[MAX_UINT44, 0, 0, 0], "7VVVVVVVVG0000000000000000"],
      [[MAX_UINT44, 0, 0, 0], "7vvvvvvvvg0000000000000000"],
      [[0, MAX_UINT28, 0, 0], "000000000FVVVVU00000000000"],
      [[0, MAX_UINT28, 0, 0], "000000000fvvvvu00000000000"],
      [[0, 0, MAX_UINT24, 0], "000000000000001VVVVS000000"],
      [[0, 0, MAX_UINT24, 0], "000000000000001vvvvs000000"],
      [[0, 0, 0, MAX_UINT32], "00000000000000000003VVVVVV"],
      [[0, 0, 0, MAX_UINT32], "00000000000000000003vvvvvv"],
      [
        [MAX_UINT44, MAX_UINT28, MAX_UINT24, MAX_UINT32],
        "7VVVVVVVVVVVVVVVVVVVVVVVVV",
      ],
      [
        [MAX_UINT44, MAX_UINT28, MAX_UINT24, MAX_UINT32],
        "7vvvvvvvvvvvvvvvvvvvvvvvvv",
      ],
    ];

    const fs = ["timestamp", "counter", "perSecRandom", "perGenRandom"];
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
      " 00SCT4FL89GQPRHN44C4LFM0OV",
      "00SCT4FL89GQPRJN44C7SQO381 ",
      " 00SCT4FL89GQPRLN44C4BGCIIO ",
      "+00SCT4FL89GQPRNN44C4F3QD24",
      "-00SCT4FL89GQPRPN44C7H4E5RC",
      "+0SCT4FL89GQPRRN44C55Q7RVC",
      "-0SCT4FL89GQPRTN44C6PN0A2R",
      "00SCT4FL89WQPRVN44C41RGVMM",
      "00SCT4FL89GQPS1N4_C54QDC5O",
      "00SCT4-L89GQPS3N44C602O0K8",
      "00SCT4FL89GQPS N44C7VHS5QJ",
      "80000000000000000000000000",
      "VVVVVVVVVVVVVVVVVVVVVVVVVV",
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
      Scru128Id.fromFields(MAX_UINT44, 0, 0, 0),
      Scru128Id.fromFields(0, MAX_UINT28, 0, 0),
      Scru128Id.fromFields(0, 0, MAX_UINT24, 0),
      Scru128Id.fromFields(0, 0, 0, MAX_UINT32),
      Scru128Id.fromFields(MAX_UINT44, MAX_UINT28, MAX_UINT24, MAX_UINT32),
    ];

    const g = new Scru128Generator();
    for (let i = 0; i < 1_000; i++) {
      cases.push(g.generate());
    }

    for (const e of cases) {
      assert(Scru128Id.fromString(e.toString()).equals(e));
      assert(Scru128Id.fromArrayBuffer(e.toArrayBuffer()).equals(e));
      assert(Scru128Id.fromHex(e.toHex()).equals(e));
      assert(
        Scru128Id.fromFields(
          e.timestamp,
          e.counter,
          e.perSecRandom,
          e.perGenRandom
        ).equals(e)
      );
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
      Scru128Id.fromFields(0, MAX_UINT28, 0, 0),
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
