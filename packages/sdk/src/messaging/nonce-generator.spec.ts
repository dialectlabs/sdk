import {
  generateNonce,
  generateRandomNonceWithPrefix,
} from './nonce-generator';

describe('Nonce generator test', () => {
  it('should always return 24 bytes', () => {
    expect(generateNonce(0)).toMatchObject(new Uint8Array(Array(24).fill(0)));
    expect(generateNonce(1)).toMatchObject(
      new Uint8Array([...Array(23).fill(0), 1]),
    );
    expect(generateNonce(333)).toMatchObject(
      new Uint8Array([...Array(21).fill(0), 3, 3, 3]),
    );
    expect(generateNonce(55555)).toMatchObject(
      new Uint8Array([...Array(19).fill(0), 5, 5, 5, 5, 5]),
    );
    expect(generateNonce(-55555)).toMatchObject(
      new Uint8Array([...Array(19).fill(0), 5, 5, 5, 5, 5]),
    );
  });

  it('should always return 24 bytes for nonce w/ prefix', () => {
    const nonce1 = generateRandomNonceWithPrefix(0);
    const nonce2 = generateRandomNonceWithPrefix(128);
    const nonce3 = generateRandomNonceWithPrefix(512);
    expect(nonce1.length).toBe(24);
    expect(nonce2.length).toBe(24);
    expect(nonce3.length).toBe(24);
  });

  it('should always set prefix in higher byte', () => {
    const nonce1 = generateRandomNonceWithPrefix(0);
    const nonce2 = generateRandomNonceWithPrefix(4);
    const nonce3 = generateRandomNonceWithPrefix(200);
    const nonce4 = generateRandomNonceWithPrefix(257);
    expect(nonce1[0]).toBe(0);
    expect(nonce2[0]).toBe(4);
    expect(nonce3[0]).toBe(200);
    expect(nonce4[0]).toBe(1);
  });
});
