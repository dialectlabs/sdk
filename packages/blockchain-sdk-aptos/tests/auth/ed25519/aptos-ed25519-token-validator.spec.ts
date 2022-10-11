import type { Token } from '@dialectlabs/sdk';
import { AptosEd25519TokenValidator } from '../../../src/auth/ed25519/aptos-ed25519-token-validator';

describe('aptos ed25519 token validator test', () => {
  let token: Token;
  let tokenValidator: AptosEd25519TokenValidator;
  beforeEach(() => {
    tokenValidator = new AptosEd25519TokenValidator();
    token = {
      rawValue: 'raw',
      body: {
        sub_jwk:
          '0x090c9c32bd9db866fb328fb4b94dedf37fe1e7c1d746d4c13b00644a9f78c15e',
        sub: '0x3cd54f21eb5789eed8036b1215c044d1eb397db1e7149c20d5bea81af84ba1b0',
        exp: Date.now(),
      },
      signature: Uint8Array.from([
        22, 210, 70, 22, 229, 185, 170, 99, 218, 210, 139, 28, 3, 120, 196, 38,
        179, 82, 15, 181, 182, 218, 56, 20, 98, 207, 97, 232, 16, 137, 78, 183,
        114, 140, 115, 44, 115, 68, 123, 242, 205, 155, 16, 82, 172, 185, 194,
        249, 54, 18, 174, 111, 114, 240, 183, 69, 113, 99, 127, 245, 21, 219,
        29, 3,
      ]),
      base64Body:
        'eyJzdWIiOiIweDNjZDU0ZjIxZWI1Nzg5ZWVkODAzNmIxMjE1YzA0NGQxZWIzOTdkYjFlNzE0OWMyMGQ1YmVhODFhZjg0YmExYjAiLCJzdWJfandrIjoiMHgwOTBjOWMzMmJkOWRiODY2ZmIzMjhmYjRiOTRkZWRmMzdmZTFlN2MxZDc0NmQ0YzEzYjAwNjQ0YTlmNzhjMTVlIiwiaWF0IjoxNjY1NDkwMzc4LCJleHAiOjE2NjU1NzY3Nzh9',
      base64Header: 'eyJhbGciOiJhcHRvcy1lZDI1NTE5IiwidHlwIjoiSldUIn0',
      header: {
        alg: 'aptos-ed25519',
        typ: 'JWT',
      },
      base64Signature:
        'FtJGFuW5qmPa0oscA3jEJrNSD7W22jgUYs9h6BCJTrdyjHMsc0R78s2bEFKsucL5NhKub3Lwt0VxY3_1FdsdAw',
    };
  });

  test('validation without paddings should be success', () => {
    token.body = {
      ...token.body,
      sub_jwk:
        '0x90c9c32bd9db866fb328fb4b94dedf37fe1e7c1d746d4c13b00644a9f78c15e',
    };

    expect(tokenValidator.performExtraValidation(token)).toBeTruthy();
    expect(tokenValidator.isSignatureValid(token)).toBeTruthy();
  });

  test('validation with paddings should be success', () => {
    token.body = {
      ...token.body,
      sub_jwk:
        '0x0000000090c9c32bd9db866fb328fb4b94dedf37fe1e7c1d746d4c13b00644a9f78c15e',
      sub: '0x0000000000000000003cd54f21eb5789eed8036b1215c044d1eb397db1e7149c20d5bea81af84ba1b0',
    };
    expect(tokenValidator.performExtraValidation(token)).toBeTruthy();
    expect(tokenValidator.isSignatureValid(token)).toBeTruthy();
  });
});
