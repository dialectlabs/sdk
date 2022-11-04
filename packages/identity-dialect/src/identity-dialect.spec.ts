import 'isomorphic-fetch';
import { DialectIdentityResolver } from './identity-dialect';

describe('dialect identity', () => {
  it('should return identity during direct lookup', async () => {
    const resolver = new DialectIdentityResolver();
    const identity = await resolver.resolve(
      'D1ALECTfeCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h',
    );
    expect(identity).toEqual({
      type: 'DIALECT_IDENTITY',
      address: 'D1ALECTfeCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h',
      name: 'dialect',
      additionals: {
        displayName: 'Dialect',
      },
    });
  });

  it('should return null during direct lookup', async () => {
    const resolver = new DialectIdentityResolver();
    const identity = await resolver.resolve('address that never exists');
    expect(identity).toBeNull();
  });

  it('should perform reverse lookup', async () => {
    const resolver = new DialectIdentityResolver();
    const identity = await resolver.resolveReverse('dialect');
    expect(identity).toEqual({
      type: 'DIALECT_IDENTITY',
      address: 'D1ALECTfeCZt9bAbPWtJk7ntv24vDYGPmyS7swp7DY5h',
      name: 'dialect',
      additionals: {
        displayName: 'Dialect',
      },
    });
  });

  it('should return null when nothing found during reverse lookup', async () => {
    const resolver = new DialectIdentityResolver();
    const identity = await resolver.resolveReverse(
      'the handle that should never exist',
    );
    expect(identity).toBeNull();
  });
});
