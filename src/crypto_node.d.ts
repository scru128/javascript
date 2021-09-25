declare module "crypto" {
  function randomFillSync<T extends TypedArray>(buffer: T): T;
}
