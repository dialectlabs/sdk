import { PublicKey } from '@solana/web3.js';
import { createSolanaSdk, createSolanaThread, sendSolanaMessage } from './helpers';

(async () => {
  const sdk = createSolanaSdk();
  const recipient = new PublicKey(
    '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
  ); // Make this arbitrary
  const thread = await createSolanaThread(sdk, recipient);
  const text = 'gm world';
  await sendSolanaMessage(thread, text);
})();
