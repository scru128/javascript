import { scru128, scru128String, Scru128Generator, Scru128Id } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

globalThis.SCRU128_DENY_WEAK_RNG = true;

describe("scru128()", function () {
  it("returns a Scru128Id object", function () {
    const obj = scru128();
    assert(obj instanceof Scru128Id);
  });
});

describe("scru128String()", function () {
  const samples = [];
  for (let i = 0; i < 100_000; i++) {
    samples[i] = scru128String();
  }

  it("generates 25-digit canonical string", function () {
    const re = /^[0-9A-Z]{25}$/;
    assert(samples.every((e) => typeof e === "string" && re.test(e)));
  });

  it("generates 100k identifiers without collision", function () {
    assert(new Set(samples).size === samples.length);
  });

  it("generates sortable string representation by creation time", function () {
    for (let i = 1; i < samples.length; i++) {
      assert(samples[i - 1] < samples[i]);
    }
  });

  it("encodes up-to-date timestamp", function () {
    const g = new Scru128Generator();
    for (let i = 0; i < 10_000; i++) {
      const tsNow = Date.now();
      const timestamp = g.generate().timestamp;
      assert(Math.abs(tsNow - timestamp) < 16);
    }
  });

  it("encodes unique sortable tuple of timestamp and counters", function () {
    let prev = Scru128Id.fromString(samples[0]);
    for (let i = 1; i < samples.length; i++) {
      const curr = Scru128Id.fromString(samples[i]);
      assert(
        prev.timestamp < curr.timestamp ||
          (prev.timestamp === curr.timestamp &&
            prev.counterHi < curr.counterHi) ||
          (prev.timestamp === curr.timestamp &&
            prev.counterHi === curr.counterHi &&
            prev.counterLo < curr.counterLo)
      );
      prev = curr;
    }
  });

  it("generates no IDs sharing same timestamp and counters by multiple async functions", async function () {
    const q = [];
    const producers = [];
    for (let i = 0; i < 4 * 10_000; i++) {
      producers.push((async () => q.push(scru128()))());
    }

    await Promise.all(producers);

    const s = new Set(
      q.map((e) => `${e.timestamp}-${e.counterHi}-${e.counterLo}`)
    );
    assert(s.size === 4 * 10_000);
  });
});
