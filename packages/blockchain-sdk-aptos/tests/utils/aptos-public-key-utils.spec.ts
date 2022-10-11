import { getPublicKeyWithPadding } from '../../src/utils/aptos-public-key-utils';
import { HexString } from 'aptos';

describe('aptos public key utils test', () => {
  test('string should be filled by 0 64 times', () => {
    const testString = '';
    const expectedResult =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    expect(
      getPublicKeyWithPadding(HexString.ensure(testString)).toString(),
    ).toEqual(expectedResult);
  });
  test('string should be filled by 0 61 times', () => {
    const testString = '123';
    const expectedResult =
      '0x0000000000000000000000000000000000000000000000000000000000000123';
    expect(
      getPublicKeyWithPadding(HexString.ensure(testString)).toString(),
    ).toEqual(expectedResult);
  });
});
