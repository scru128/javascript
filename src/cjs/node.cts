export * from "./index.cjs";

import * as nodeCrypto from "crypto";
import { _setRandom } from "./index.cjs";

if (typeof crypto === "undefined" || !crypto.getRandomValues) {
  if (nodeCrypto && nodeCrypto.randomFillSync) {
    _setRandom(nodeCrypto.randomFillSync);
  }
}
