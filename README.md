# SCRU128: Sortable, Clock and Random number-based Unique identifier

[![npm](https://img.shields.io/npm/v/scru128)](https://www.npmjs.com/package/scru128)
[![License](https://img.shields.io/npm/l/scru128)](https://github.com/scru128/javascript/blob/main/LICENSE)

SCRU128 ID is yet another attempt to supersede [UUID] for the users who need
decentralized, globally unique time-ordered identifiers. SCRU128 is inspired by
[ULID] and [KSUID] and has the following features:

- 128-bit unsigned integer type
- Sortable by generation time (as integer and as text)
- 25-digit case-insensitive textual representation (Base36)
- 48-bit millisecond Unix timestamp that ensures useful life until year 10889
- Up to 281 trillion time-ordered but unpredictable unique IDs per millisecond
- 80-bit three-layer randomness for global uniqueness

```javascript
import { scru128, scru128String } from "scru128";
// or on browsers:
// import { scru128, scru128String } from "https://unpkg.com/scru128@^2";

// generate a new identifier object
const x = scru128();
console.log(String(x)); // e.g. "036Z951MHJIKZIK2GSL81GR7L"
console.log(BigInt(x.toHex())); // as a 128-bit unsigned integer

// generate a textual representation directly
console.log(scru128String()); // e.g. "036Z951MHZX67T63MQ9XE6Q0J"
```

See [SCRU128 Specification] for details.

[uuid]: https://en.wikipedia.org/wiki/Universally_unique_identifier
[ulid]: https://github.com/ulid/spec
[ksuid]: https://github.com/segmentio/ksuid
[scru128 specification]: https://github.com/scru128/spec

## License

Licensed under the Apache License, Version 2.0.

## See also

- [API Documentation](https://scru128.github.io/javascript/docs/)
- [Run tests on your browser](https://scru128.github.io/javascript/test/)
