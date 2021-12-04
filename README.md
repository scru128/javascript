# SCRU128: Sortable, Clock and Random number-based Unique identifier

SCRU128 ID is yet another attempt to supersede [UUID] in the use cases that need
decentralized, globally unique time-ordered identifiers. SCRU128 is inspired by
[ULID] and [KSUID] and has the following features:

- 128-bit unsigned integer type
- Sortable by generation time (as integer and as text)
- 26-digit case-insensitive portable textual representation
- 44-bit biased millisecond timestamp that ensures remaining life of 550 years
- Up to 268 million time-ordered but unpredictable unique IDs per millisecond
- 84-bit _layered_ randomness for collision resistance

```javascript
import { scru128, scru128String } from "scru128";

// generate a new identifier object
const x = scru128();
console.log(String(x)); // e.g. "00S6GVKR1MH58KE72EJD87SDOO"
console.log(BigInt(x.toHex())); // as a 128-bit unsigned integer

// generate a textual representation directly
console.log(scru128String()); // e.g. "00S6GVKR3F7R79I72EJF0J4RGC"
```

See [SCRU128 Specification] for details.

[uuid]: https://en.wikipedia.org/wiki/Universally_unique_identifier
[ulid]: https://github.com/ulid/spec
[ksuid]: https://github.com/segmentio/ksuid
[scru128 specification]: https://github.com/scru128/spec

## License

Copyright 2021 LiosK

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

## See also

- [scru128 - npm](https://www.npmjs.com/package/scru128)
- [API Documentation](https://scru128.github.io/javascript/docs/)
- [Run tests on your browser](https://scru128.github.io/javascript/test/)
