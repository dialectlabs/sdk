import { Dialect, IllegalStateError, NodeDialectWalletAdapter } from '../src';
import { PublicKey } from '@solana/web3.js';

(async () => {
  const sdk = Dialect.sdk({
    environment: 'local-development',
    wallet: NodeDialectWalletAdapter.create(),
  });
  const dapp = await sdk.dapps.find();
  if (!dapp) {
    throw new IllegalStateError(
      "Dapp doesn't exist, please create dapp before using it",
    );
  }
  const recipient = new PublicKey(
    '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
  );
  // Unicast
  await dapp.notifications.send({
    title: 'Hello',
    message: 'Hello, world',
    recipient,
  });
  // Multicast
  await dapp.notifications.send({
    title: 'Hello',
    message: 'Hello, world',
    recipients: [recipient],
  });
  // Broadcast, in this case notification is sent to all dapp subscribers using all user-enabled notification channels
  await dapp.notifications.send({
    title: 'Hello',
    message: 'Hello, world',
  });
})();
