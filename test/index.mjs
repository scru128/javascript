import { scru128, _internal } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

describe("scru128()", function () {
  const samples = [];
  for (let i = 0; i < 100_000; i++) {
    samples[i] = scru128();
  }

  it("generates 26-character canonical string", function () {
    const re = /^[0-7][0-9A-V]{25}$/;
    assert(samples.every((e) => typeof e === "string" && re.test(e)));
  });

  it("generates 100k identifiers without collision", function () {
    assert(new Set(samples).size === samples.length);
  });

  it("generates sortable string representation by creation time", function () {
    const sorted = samples.slice().sort();
    for (let i = 0; i < samples.length; i++) {
      assert(samples[i] === sorted[i]);
    }
  });

  it("encodes up-to-date unix timestamp", function () {
    const epoch = Date.UTC(2020, 0);
    for (let i = 0; i < 10_000; i++) {
      const tsNow = Date.now() - epoch;
      const timestamp = _internal.Identifier.fromString(scru128()).timestamp;
      assert(Math.abs(tsNow - timestamp) < 16);
    }
  });

  it("encodes unique sortable pair of timestamp and counter", function () {
    let prev = _internal.Identifier.fromString(samples[0]);
    for (let i = 1; i < samples.length; i++) {
      const curr = _internal.Identifier.fromString(samples[i]);
      assert(
        prev.timestamp < curr.timestamp ||
          (prev.timestamp === curr.timestamp && prev.counter < curr.counter)
      );
      prev = curr;
    }
  });
});
