# Changelog

## v3.0.3 - unreleased

### Maintenance

- Refactored default random number generator to defer detection Web Crypto API
  until creation of `Scru128Generator`
- Fixed wrong test case

## v3.0.2 - 2023-07-17

Most notably, v3 switches the letter case of generated IDs from uppercase (e.g.,
"036Z951MHJIKZIK2GSL81GR7L") to lowercase (e.g., "036z951mhjikzik2gsl81gr7l"),
though it is technically not supposed to break existing code because SCRU128 is
a case-insensitive scheme. Other changes include the removal of deprecated APIs.

### Removed

- CommonJS entry point
- Deprecated items:
  - `Scru128Generator#generateCore()`
  - `Scru128Generator#getLastStatus()`
  - `Scru128Id.fromArrayBuffer()`
  - `Scru128Id#toArrayBuffer()`
- `node:crypto`-based CSPRNG implementation; now falls back on `Math.random()`
  in Node v14 or older where Web Crypto API is not yet available
- Non-ESM browser test runner

### Changed

- Letter case of generated IDs from uppercase to lowercase
- TypeScript transpilation target from ES2015 to ES2016
- Edge case behavior of generator functions' rollback allowance handling

### Maintenance

- Updated dev dependencies

## v2.5.0 - 2023-06-21

### Added

- `Scru128Id.fromBigInt()` and `Scru128Id#toBigInt()`

### Changed

- Error messages thrown by `Scru128Id` to improve error reporting

### Deprecated

- `Scru128Id.fromArrayBuffer()` and `Scru128Id#toArrayBuffer()`

### Maintenance

- Updated dev dependencies

## v2.4.1 - 2023-04-07

### Maintenance

- Updated dev dependencies
- Tweaked docs and tests

## v2.4.0 - 2023-03-22

### Added

- `generateOrAbort()` and `generateOrAbortCore()` to `Scru128Generator`
  (formerly named as `generateNoRewind()` and `generateCoreNoRewind()`)
- `Scru128Generator#generateOrResetCore()`

### Deprecated

- `Scru128Generator#generateCore()`
- `Scru128Generator#getLastStatus()`

### Maintenance

- Updated TypeScript version to 5.0

## v2.3.2 - 2023-03-19

### Added

- `generateNoRewind()` and `generateCoreNoRewind()` to `Scru128Generator`
  (experimental)

### Changed

- Precedence of PRNG selection in Node.js: Web Crypto first if available
  - node:crypto > Web Crypto > Math.random -> Web > node > Math

### Maintenance

- Improved documentation about generator method flavors
- Updated dev dependencies

## v2.3.1 - 2023-02-18

### Added

- `Scru128Id#bytes`, `Scru128Id.ofInner()`, and `Scru128Id.fromBytes()`

### Maintenance

- Updated dev dependencies

## v2.2.1 - 2023-01-31

### Added

- CHANGELOG.md to NPM package

### Maintenance

- Adopted `node16` module setting to build CommonJS entry point
- Updated dev dependencies

## v2.2.0 - 2022-12-25

### Added

- Iterable and Iterator implementations to `Scru128Generator` to make it work as
  infinite iterator

### Maintenance

- Updated dev dependencies

## v2.1.3 - 2022-11-28

### Maintenance

- Updated dev dependencies

## v2.1.2 - 2022-06-11

### Fixed

- `generateCore()` to update `counter_hi` when `timestamp` passed < 1000

### Maintenance

- Updated dev dependencies

## v2.1.1 - 2022-05-23

### Fixed

- `generateCore()` to reject zero as `timestamp` value

### Maintenance

- Updated dev dependencies

## v2.1.0 - 2022-05-22

### Added

- `generateCore()` and `getLastStatus()` to `Scru128Generator`

### Maintenance

- Updated dev dependencies

## v2.0.0 - 2022-05-01

### Changed

- Textual representation: 26-digit Base32 -> 25-digit Base36
- Field structure: { `timestamp`: 44 bits, `counter`: 28 bits, `per_sec_random`:
  24 bits, `per_gen_random`: 32 bits } -> { `timestamp`: 48 bits, `counter_hi`:
  24 bits, `counter_lo`: 24 bits, `entropy`: 32 bits }
- Timestamp epoch: 2020-01-01 00:00:00.000 UTC -> 1970-01-01 00:00:00.000 UTC
- Counter overflow handling: stall generator -> increment timestamp
- Dual packaging method: CommonJS + ESM wrapper -> native ESM + isolate CommonJS

### Removed

- `setLogger()` as counter overflow is no longer likely to occur
- `TIMESTAMP_BIAS`
- `Scru128Id#counter`, `Scru128Id#perSecRandom`, `Scru128Id#perGenRandom`

### Added

- `Scru128Id#counterHi`, `Scru128Id#counterLo`, `Scru128Id#entropy`

### Deprecated

- CommonJS entry points

## v1.0.1 - 2022-03-15

### Maintenance

- Updated dev dependencies

## v1.0.0 - 2022-01-03

- Initial stable release
