import { createSdk } from './helpers';

(async () => {
  const sdk = createSdk();
  const messages = await sdk.wallet.dappMessages.findAll({
    dappVerified: true,
  });
  console.log({messages});
})()
