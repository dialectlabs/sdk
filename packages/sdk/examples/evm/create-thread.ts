import { ethers } from 'ethers';
import { createEvmSdk, createEvmThread } from '../helpers';

(async () => {
  const sdk = createEvmSdk();
  const recipient = ethers.Wallet.createRandom();
  console.log({ recipient: recipient.address });
  await createEvmThread(sdk, recipient.address);
})();
