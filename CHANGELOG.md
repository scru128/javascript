# Changelog

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
