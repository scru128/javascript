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
    let [prev, status] = g.generateCore(ts);
    assert(status === "NEW_TIMESTAMP");
    assert(prev.timestamp === ts);
    for (let i = 0; i < 100_000; i++) {
      const [curr, status] = g.generateCore(ts - Math.min(9_998, i));
      assert(
        status === "COUNTER_LO_INC" ||
          status === "COUNTER_HI_INC" ||
          status === "TIMESTAMP_INC"
      );
      assert(prev.compareTo(curr) < 0);
      prev = curr;
    }
    assert(prev.timestamp >= ts);
  });

  it("breaks increasing order of IDs if timestamp moves backward a lot", function () {
    const ts = 0x0123_4567_89ab;
    const g = new Scru128Generator();
    const [prev, prevStatus] = g.generateCore(ts);
    assert(prevStatus === "NEW_TIMESTAMP");
    assert(prev.timestamp === ts);
    const [curr, currStatus] = g.generateCore(ts - 10_000);
    assert(currStatus === "CLOCK_ROLLBACK");
    assert(prev.compareTo(curr) > 0);
    assert(curr.timestamp == ts - 10_000);
  });
});
