import { PublicKey } from '@solana/web3.js';
import { createSdk, createThread } from './helpers';

(async () => {
  const sdk = createSdk();
  const recipient = new PublicKey(
    '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
  ); // Make this arbitrary
  await createThread(sdk, recipient);
})();
