import { createSolanaSdk, createSolanaThread } from './helpers';

(async () => {
  const sdk = createSolanaSdk();
  const recipient = '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk'; // Make this arbitrary
  await createSolanaThread(sdk, recipient);
})();
