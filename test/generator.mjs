import { Scru128Generator, Scru128Id } from "../dist/index.js";

const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.SCRU128_DENY_WEAK_RNG = true;

describe("Scru128Generator", function () {
  describe("#generateOrResetCore()", function () {
    it("generates increasing IDs even with decreasing or constant timestamp", function () {
      const ts = 0x0123_4567_89ab;
      const g = new Scru128Generator();

      let prev = g.generateOrResetCore(ts, 10_000);
      assert(prev.timestamp === ts);

      for (let i = 0; i < 100_000; i++) {
        const curr = g.generateOrResetCore(ts - Math.min(9_999, i), 10_000);
        assert(prev.compareTo(curr) < 0);
        prev = curr;
      }
      assert(prev.timestamp >= ts);
    });

    it("breaks increasing order of IDs if timestamp goes backwards a lot", function () {
      const ts = 0x0123_4567_89ab;
      const g = new Scru128Generator();

      let prev = g.generateOrResetCore(ts, 10_000);
      assert(prev.timestamp === ts);

      let curr = g.generateOrResetCore(ts - 10_000, 10_000);
      assert(prev.compareTo(curr) < 0);

      prev = curr;
      curr = g.generateOrResetCore(ts - 10_001, 10_000);
      assert(prev.compareTo(curr) > 0);
      assert(curr.timestamp == ts - 10_001);

      prev = curr;
      curr = g.generateOrResetCore(ts - 10_002, 10_000);
      assert(prev.compareTo(curr) < 0);
    });
  });

  describe("#generateOrAbortCore()", function () {
    it("generates increasing IDs even with decreasing or constant timestamp", function () {
      const ts = 0x0123_4567_89ab;
      const g = new Scru128Generator();

      let prev = g.generateOrAbortCore(ts, 10_000);
      assert(prev !== undefined);
      assert(prev.timestamp === ts);

      for (let i = 0; i < 100_000; i++) {
        const curr = g.generateOrAbortCore(ts - Math.min(9_999, i), 10_000);
        assert(curr !== undefined);
        assert(prev.compareTo(curr) < 0);
        prev = curr;
      }
      assert(prev.timestamp >= ts);
    });

    it("returns undefined if timestamp goes backwards a lot", function () {
      const ts = 0x0123_4567_89ab;
      const g = new Scru128Generator();

      const prev = g.generateOrAbortCore(ts, 10_000);
      assert(prev !== undefined);
      assert(prev.timestamp === ts);

      let curr = g.generateOrAbortCore(ts - 10_000, 10_000);
      assert(curr !== undefined);
      assert(prev.compareTo(curr) < 0);

      curr = g.generateOrAbortCore(ts - 10_001, 10_000);
      assert(curr === undefined);

      curr = g.generateOrAbortCore(ts - 10_002, 10_000);
      assert(curr === undefined);
    });
  });

  it("is iterable with for-of loop", function () {
    let i = 0;
    for (const e of new Scru128Generator()) {
      assert(e instanceof Scru128Id);
      i += 1;
      if (i > 100) {
        break;
      }
    }
    assert(i === 101);
  });
});
