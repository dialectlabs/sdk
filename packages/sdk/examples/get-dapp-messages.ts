import { createSdk } from './helpers';

(async () => {
  const sdk = createSdk();
  const messages = await sdk.wallet.messages.findAllFromDapps({
    dappVerified: true,
  });
  console.log({ messages });
})();
