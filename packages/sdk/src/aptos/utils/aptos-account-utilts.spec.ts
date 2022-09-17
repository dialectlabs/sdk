import { AptosAccount } from 'aptos';
import { getAptosAccountAddress } from './aptos-account-utilts';

describe('aptos account utils', () => {
  it('should extract aptos account address from public key hex string correctly (no-rotation)', async () => {
    // given
    const aptosAccount = new AptosAccount();
    const publicKey = aptosAccount.pubKey().hex();
    // when
    const address = getAptosAccountAddress(publicKey);
    // then
    expect(address).toEqual(aptosAccount.address());
  });

  it('should extract aptos account address from public key string correctly (no-rotation)', async () => {
    // given
    const aptosAccount = new AptosAccount();
    const publicKey = aptosAccount.pubKey().toString();
    // when
    const address = getAptosAccountAddress(publicKey);
    // then
    expect(address).toEqual(aptosAccount.address());
  });
});
