import {
  deserializeDiffeHellmanKeys,
  serializeDiffeHellmanKeys,
} from './encryption-keys-store';
import type { DiffeHellmanKeys } from './encryption.interface';

describe('encryption storage test', () => {
  it('should serialize and deserialize diffe hellman keys to the same object', () => {
    const keys: DiffeHellmanKeys = {
      publicKey: new Uint8Array([1, 2, 3]),
      secretKey: new Uint8Array([2, 2, 8]),
    };

    const serialized = serializeDiffeHellmanKeys(keys);
    const deserilized = deserializeDiffeHellmanKeys(serialized);

    expect(deserilized).toEqual(keys);
  });
});
