import { PublicKey } from '@solana/web3.js';
import { createSolanaSdk, createSolanaThread, getSolanaThreads } from './helpers';

(async () => {
  const sdk = createSolanaSdk();
  const recipient = new PublicKey(
    '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
  ); // Make this arbitrary
  await createSolanaThread(sdk, recipient)
  const threads = await getSolanaThreads(sdk);
  console.log({ threads });
  console.log(sdk.config);
})();
