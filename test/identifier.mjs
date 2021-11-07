import { scru128, Scru128Generator, Scru128Id } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

describe("Scru128Id", function () {
  it("encodes and decodes prepared cases correctly", function () {
    const cases = [
      [[0, 0, 0, 0], "00000000000000000000000000"],
      [[2 ** 44 - 1, 0, 0, 0], "7VVVVVVVVG0000000000000000"],
      [[0, 2 ** 28 - 1, 0, 0], "000000000FVVVVU00000000000"],
      [[0, 0, 2 ** 24 - 1, 0], "000000000000001VVVVS000000"],
      [[0, 0, 0, 2 ** 32 - 1], "00000000000000000003VVVVVV"],
      [
        [2 ** 44 - 1, 2 ** 28 - 1, 2 ** 24 - 1, 2 ** 32 - 1],
        "7VVVVVVVVVVVVVVVVVVVVVVVVV",
      ],
    ];

    const fs = ["timestamp", "counter", "perSecRandom", "perGenRandom"];
    for (const e of cases) {
      const fromFields = Scru128Id.fromFields(...e[0]);
      const fromStr = Scru128Id.fromString(e[1]);

      assert(fromFields.equals(fromStr));
      assert(fromFields.toHex() === fromStr.toHex());
      assert(fromFields.toString() === e[1]);
      assert(fromStr.toString() === e[1]);
      for (let i = 0; i < fs.length; i++) {
        assert(fromFields[fs[i]] === e[0][i]);
        assert(fromStr[fs[i]] === e[0][i]);
      }
    }
  });

  it("has symmetric converters from/to string, hex, and fields", function () {
    const g = new Scru128Generator();
    for (let i = 0; i < 1_000; i++) {
      const obj = g.generate();
      assert(Scru128Id.fromString(obj.toString()).equals(obj));
      assert(Scru128Id.fromHex(obj.toHex()).equals(obj));
      assert(
        Scru128Id.fromFields(
          obj.timestamp,
          obj.counter,
          obj.perSecRandom,
          obj.perGenRandom
        ).equals(obj)
      );
    }
  });

  it("supports comparison methods", function () {
    const ordered = [
      Scru128Id.fromFields(0, 0, 0, 0),
      Scru128Id.fromFields(0, 0, 0, 1),
      Scru128Id.fromFields(0, 0, 1, 0),
      Scru128Id.fromFields(0, 1, 0, 0),
      Scru128Id.fromFields(1, 0, 0, 0),
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
});
