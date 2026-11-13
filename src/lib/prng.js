// Small deterministic PRNG (mulberry32) so demo data is identical on every device.
export function createPrng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    // integer in [min, max]
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
  };
}
