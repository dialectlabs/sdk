import { createAptosSdk, createAptosThread, sendMessage } from '../helpers';
import { AptosAccount } from 'aptos';

(async () => {
  const sdk = createAptosSdk();
  const recipient = new AptosAccount().pubKey().toString(); // Make this arbitrary
  const thread = await createAptosThread(sdk, recipient);
  const text = 'gm world';
  await sendMessage(thread, text);
})();
