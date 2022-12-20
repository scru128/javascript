import { scru128, scru128String, Scru128Generator, Scru128Id } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.SCRU128_DENY_WEAK_RNG = true;

describe("Scru128Generator", function () {
  it("generates increasing IDs even with decreasing or constant timestamp", function () {
    const ts = 0x0123_4567_89ab;
    const g = new Scru128Generator();
    assert(g.getLastStatus() === "NOT_EXECUTED");

    let prev = g.generateCore(ts);
    assert(g.getLastStatus() === "NEW_TIMESTAMP");
    assert(prev.timestamp === ts);

    for (let i = 0; i < 100_000; i++) {
      const curr = g.generateCore(ts - Math.min(9_998, i));
      assert(
        g.getLastStatus() === "COUNTER_LO_INC" ||
          g.getLastStatus() === "COUNTER_HI_INC" ||
          g.getLastStatus() === "TIMESTAMP_INC"
      );
      assert(prev.compareTo(curr) < 0);
      prev = curr;
    }
    assert(prev.timestamp >= ts);
  });

  it("breaks increasing order of IDs if timestamp moves backward a lot", function () {
    const ts = 0x0123_4567_89ab;
    const g = new Scru128Generator();
    assert(g.getLastStatus() === "NOT_EXECUTED");

    const prev = g.generateCore(ts);
    assert(g.getLastStatus() === "NEW_TIMESTAMP");
    assert(prev.timestamp === ts);

    const curr = g.generateCore(ts - 10_000);
    assert(g.getLastStatus() === "CLOCK_ROLLBACK");
    assert(prev.compareTo(curr) > 0);
    assert(curr.timestamp == ts - 10_000);
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
