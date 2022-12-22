import {
  createEvmSdk,
  createEvmThread,
  getEvmMessages,
  getEvmThreads,
  sendMessage,
} from './helpers';
import { ethers } from 'ethers';
import type { Thread } from '@dialectlabs/sdk';

(async () => {
  const sdk = createEvmSdk();
  const recipient = ethers.Wallet.createRandom();
  const thread_ = await createEvmThread(sdk, recipient.address);
  await sendMessage(thread_, 'gm');
  const threads = await getEvmThreads(sdk);
  if (threads.length < 1 || !threads[0]) {
    console.log(
      'You have no threads. Try creating a thread and sending a message first.',
    );
    return;
  }
  const thread: Thread = threads[0];
  await getEvmMessages(sdk, thread.id);
})();
