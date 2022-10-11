import type { Token } from '@dialectlabs/sdk';
import { AptosEd25519PayloadTokenValidator } from '../../../src/auth/ed25519-payload/aptos-ed25519-payload-token-validator';

describe('aptos ed25519 payload token validator test', () => {
  let token: Token;
  let tokenValidator: AptosEd25519PayloadTokenValidator;
  beforeEach(() => {
    tokenValidator = new AptosEd25519PayloadTokenValidator();
    token = {
      rawValue: 'raw',
      body: {
        sub_jwk:
          '0x0f1e91d36e0eb1f1f3f9088039ed59a02461a5acf39b27862bf3fad75724b708',
        sub: '0x216400966ee27a01f9e47d6d06942dba88e4b4f22351ad2563fe8d8718d0d70e',
        exp: Date.now(),
      },
      signature: Uint8Array.from([
        13, 182, 147, 203, 250, 151, 75, 161, 233, 33, 16, 99, 50, 107, 209,
        250, 32, 208, 217, 25, 127, 199, 43, 99, 66, 244, 87, 141, 89, 237, 48,
        61, 48, 126, 66, 36, 33, 66, 114, 221, 103, 64, 128, 65, 74, 130, 201,
        42, 98, 65, 247, 118, 248, 28, 208, 114, 175, 220, 221, 9, 232, 61, 164,
        13,
      ]),
      base64Body:
        'QVBUT1MKbWVzc2FnZTogZXlKaGJHY2lPaUpoY0hSdmN5MWxaREkxTlRFNUxYQmhlV3h2WVdRaUxDSjBlWEFpT2lKS1YxUWlmUS5leUp6ZFdJaU9pSXdlREl4TmpRd01EazJObVZsTWpkaE1ERm1PV1UwTjJRMlpEQTJPVFF5WkdKaE9EaGxOR0kwWmpJeU16VXhZV1F5TlRZelptVTRaRGczTVRoa01HUTNNR1VpTENKemRXSmZhbmRySWpvaU1IZ3daakZsT1RGa016WmxNR1ZpTVdZeFpqTm1PVEE0T0RBek9XVmtOVGxoTURJME5qRmhOV0ZqWmpNNVlqSTNPRFl5WW1ZelptRmtOelUzTWpSaU56QTRJaXdpYVdGMElqb3hOalkxTkRreE16WXlMQ0psZUhBaU9qRTJOalUxTnpjM05qSjkKbm9uY2U6IDB4ZTYzZDI2MjA0YjcwOTU5NTIwYmRiYTFkYzE1NWZhY2E5NDBjODA5NmIzYzkwOTM4OWYwNjIwN2ZjZjZhN2IyMQ',
      base64Header:
        'eyJhbGciOiJhcHRvcy1lZDI1NTE5LXBheWxvYWQiLCJ0eXAiOiJKV1QifQ',
      header: {
        alg: 'aptos-ed25519-payload',
        typ: 'JWT',
      },
      base64Signature:
        'DbaTy_qXS6HpIRBjMmvR-iDQ2Rl_xytjQvRXjVntMD0wfkIkIUJy3WdAgEFKgskqYkH3dvgc0HKv3N0J6D2kDQ',
    };
  });

  test('validation without paddings should be success', () => {
    token.body = {
      ...token.body,
      sub_jwk:
        '0xf1e91d36e0eb1f1f3f9088039ed59a02461a5acf39b27862bf3fad75724b708',
    };

    expect(tokenValidator.performExtraValidation(token)).toBeTruthy();
    expect(tokenValidator.isSignatureValid(token)).toBeTruthy();
  });

  test('validation with paddings should be success', () => {
    token.body = {
      ...token.body,
      sub_jwk:
        '0x0000000f1e91d36e0eb1f1f3f9088039ed59a02461a5acf39b27862bf3fad75724b708',
      sub: '0x00000000000216400966ee27a01f9e47d6d06942dba88e4b4f22351ad2563fe8d8718d0d70e',
    };
    expect(tokenValidator.performExtraValidation(token)).toBeTruthy();
    expect(tokenValidator.isSignatureValid(token)).toBeTruthy();
  });
});
