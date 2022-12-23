import { createEvmSdk, createEvmThread, sendMessage } from './helpers';
import { ethers } from 'ethers';

(async () => {
  const sdk = createEvmSdk();
  const recipient = ethers.Wallet.createRandom();
  const thread = await createEvmThread(sdk, recipient.address);
  const text = 'gm world';
  await sendMessage(thread, text);
})();
