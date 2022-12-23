import { createSolanaSdk, createSolanaThread, sendMessage } from './helpers';

(async () => {
  const sdk = createSolanaSdk();
  const recipient = '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk'; // Make this arbitrary
  const thread = await createSolanaThread(sdk, recipient);
  const text = 'gm world';
  await sendMessage(thread, text);
})();
