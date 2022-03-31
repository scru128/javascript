declare module "crypto" {
  function randomFillSync<T extends Uint8Array | Uint16Array | Uint32Array>(
    buffer: T
  ): T;
}
