import { DialectWalletAdapterWrapper } from "@wallet-adapter/dialect-wallet-adapter-wrapper";
import { NodeDialectWalletAdapter } from "@wallet-adapter/node-dialect-wallet-adapter";
import { ChainType, LitEncryptionProvider } from "@encryption/internal/lit/lit-encryption-provider";
import { LitSignatureStore } from "@encryption/internal/lit/lit-sig-store";
import { Keypair, PublicKey } from "@solana/web3.js";

// TO RUN SUCCESSFULLY: 
// 1) add "type": "module" to package.json
// 2) run with the following command
//      'node --experimental-vm-modules node_modules/.bin/jest ./src/internal/encryption/lit/lit-encryption.spec.ts'

describe('lit encryption tests', () => {
  let wallet1: DialectWalletAdapterWrapper;
  let provider1: LitEncryptionProvider;

  let wallet2: DialectWalletAdapterWrapper;
  let provider2: LitEncryptionProvider;

  beforeEach(() => {
    wallet1 = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    provider1 = new LitEncryptionProvider(ChainType.Solana, wallet1, LitSignatureStore.createInMemory());

    wallet2 = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    provider2 = new LitEncryptionProvider(ChainType.Solana, wallet2, LitSignatureStore.createInMemory());
  });

  test('test access control conditions', () => {
    // when
    const singleKey = Keypair.generate().publicKey;
    const multiKey = [Keypair.generate().publicKey, Keypair.generate().publicKey];
    const conditions = provider1.getSolanaAccessControlConditionForWallets([singleKey]);
    const conditions2 = provider1.getSolanaAccessControlConditionForWallets(multiKey);

    // then
    // the length of the conditions should be 1
    expect(conditions.length).toBe(1);
    expect(conditions2.length).toBe(3); // A or B is 3 conditions

  });

  test('deterministic access control conditions', () => {
    // when
    const keys = (new Array(10)).fill(0).map(() => Keypair.generate().publicKey); // randomly generate 30 pubkeys
    const shuffledConditions = (new Array(10)).fill(0).map(() => provider1.getSolanaAccessControlConditionForWallets(shuffle(keys))); // shuffle each 10 times and get access control conditions

    // then
    for (var i = 0; i < shuffledConditions.length - 1; i++) { // checking entire equality of nested array
      expect(shuffledConditions[i]).toEqual(shuffledConditions[i+1]); // for each set of conditions, check it's equal to the next
    }
  });

  test('encrypt/decrypt single member', async () => {
    // given
    const originalMessage = `Hey it's ${wallet1.publicKey.toBase58()}`;
    const otherMembers: PublicKey[] = [];

    // when
    const { encryptedString, encryptedSymmetricKey }  = await provider1.encrypt(originalMessage, otherMembers);
    console.log("original message: ", originalMessage);

    // then
    const decryptedString = await provider1.decrypt(encryptedString, otherMembers, encryptedSymmetricKey);
    console.log("decrypted string: ", decryptedString);
    expect(decryptedString).toEqual(originalMessage);
  });

  test('encrypt/decrypt dual member', async () => {
    // given
    const originalMessage = `Hey it's ${wallet1.publicKey.toBase58()}`;
    const { encryptedString, encryptedSymmetricKey }  = await provider1.encrypt(originalMessage, [wallet2.publicKey]);

    // then
    const decryptedString = await provider2.decrypt(encryptedString,  [wallet1.publicKey], encryptedSymmetricKey);
    expect(decryptedString).toEqual(originalMessage);
  });

   test('create key for thread', async () => {
     // given
     const encryptedSymmetricKey = await provider1.createEncryptedSymmetricKey([]);

     // then
     expect(encryptedSymmetricKey).not.toBeNull();
   });

   test('create key, encrypt/decrypt single member', async () => {
     // given
     const originalMessage = `Hey it's ${wallet1.publicKey.toBase58()}`;
     const otherMembers: PublicKey[] = [];

     // when
     const encryptionKey = await provider1.createEncryptedSymmetricKey(otherMembers);
     const { encryptedString } = await provider1.encrypt(originalMessage, otherMembers, encryptionKey);

     // then
     const decryptedString = await provider1.decrypt(encryptedString, otherMembers, encryptionKey);
     expect(decryptedString).toEqual(originalMessage);
   });

   test('create key, encrypt/decrypt dual member', async () => {
        // given
        const originalMessage = `Hey it's ${wallet1.publicKey.toBase58()}`;

        // when
        const encryptionKey = await provider1.createEncryptedSymmetricKey([wallet2.publicKey]);
        const { encryptedString } = await provider1.encrypt(originalMessage, [wallet2.publicKey], encryptionKey);

        // then
        const decryptedString = await provider2.decrypt(encryptedString, [wallet1.publicKey], encryptionKey);
        expect(decryptedString).toEqual(originalMessage);
     });
});
  

// entropy fxn for access control test
export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex]!, array[currentIndex]!];
  }

  return array;
};