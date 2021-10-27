import { scru128, _internal } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

describe("Internal", function () {
  describe("getRandomBits()", function () {
    const rng = _internal.detectRng();

    it("generates uniformly distributed random bits", function () {
      // test if random bits are set to 1 at ~50% probability
      // set margin based on binom dist 99.999% confidence interval
      const N_SAMPLES = 2_000;
      const margin = 4.417173 * Math.sqrt((0.5 * 0.5) / N_SAMPLES);

      for (let k = 4; k <= 48; k += 4) {
        const max = 2 ** k;

        // count each bit's one
        const bins = new Array(k).fill(0);
        for (let i = 0; i < N_SAMPLES; i++) {
          let n = rng(k);
          assert(0 <= n && n < max);
          for (let j = 0; j < k; j++) {
            bins[k - j - 1] += n % 2;
            n = Math.trunc(n / 2);
          }
          assert(n === 0);
        }

        for (let i = 0; i < k; i++) {
          const p = bins[i] / N_SAMPLES;
          assert(Math.abs(p - 0.5) < margin, `Msb ${i}: ${p}`);
        }
      }
    });
  });
});
