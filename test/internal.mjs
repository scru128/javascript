import { scru128, _internal } from "scru128";
const assert = (expression, message = "") => {
  if (!expression) {
    throw new Error("Assertion failed" + (message ? ": " + message : ""));
  }
};

describe("Internal", function () {
  describe("Identifier", function () {
    it("encodes and decodes special cases correctly", function () {
      const cases = [
        [[0, 0, 0, 0], "00000000000000000000000000"],
        [[2 ** 44 - 1, 0, 0, 0], "7VVVVVVVVG0000000000000000"],
        [[0, 2 ** 28 - 1, 0, 0], "000000000FVVVVU00000000000"],
        [[0, 0, 2 ** 16 - 1, 0], "000000000000001VVV00000000"],
        [[0, 0, 0, 2 ** 40 - 1], "000000000000000000VVVVVVVV"],
        [
          [2 ** 44 - 1, 2 ** 28 - 1, 2 ** 16 - 1, 2 ** 40 - 1],
          "7VVVVVVVVVVVVVVVVVVVVVVVVV",
        ],
      ];

      const fs = ["timestamp", "counter", "perSecRandom", "perGenRandom"];
      for (const e of cases) {
        const fromNums = new _internal.Identifier(...e[0]);
        const fromStr = _internal.Identifier.fromString(e[1]);

        assert(fromNums.toString() === e[1] && fromStr.toString() === e[1]);
        for (let i = 0; i < fs.length; i++) {
          assert(fromNums[fs[i]] === e[0][i] && fromStr[fs[i]] === e[0][i]);
        }
      }
    });

    it("has symmetric fromString() and toString()", function () {
      for (let i = 0; i < 1_000; i++) {
        const src = scru128();
        assert(_internal.Identifier.fromString(src).toString() === src);
      }
    });
  });

  describe("getRandomUint()", function () {
    const rng = _internal.detectRng();

    it("generates uniformly distributed random number", function () {
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
