import { PublicKey } from '@solana/web3.js';
import { createAptosSdk, createAptosThread } from './helpers';
import { AptosAccount } from 'aptos';

(async () => {
  const sdk = createAptosSdk();
  const recipient = new AptosAccount() ; // Make this arbitrary
  console.log({recipienttt: recipient.pubKey().toString()});
  await createAptosThread(sdk, recipient.pubKey().toString());
})();
