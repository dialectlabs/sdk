import { PublicKey } from '@solana/web3.js';
import { createSdk, createThread, sendMessage } from './helpers';

(async () => {
  const sdk = createSdk();
  const recipient = new PublicKey('3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk') // Make this arbitrary
  const thread = await createThread(sdk, recipient);
  const text = 'gm world';
  await sendMessage(thread, text);
})()
