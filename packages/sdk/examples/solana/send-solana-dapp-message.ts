import { AddressType, IllegalStateError } from '../../src';
import { PublicKey } from '@solana/web3.js';
import { createSolanaSdk } from '../helpers';

(async () => {
  const sdk = createSolanaSdk();
  await sdk.dapps.create({ name: "Kevin's dapp" });
  const dapp = await sdk.dapps.find();
  if (!dapp) {
    throw new IllegalStateError(
      "Dapp doesn't exist, please create dapp before using it",
    );
  }
  const recipient = new PublicKey(
    '3vuCFLbVWsNeWgyxkb2xiLQuxKDW83HWiTMmodT8gmtk',
  ).toBase58();
  const recipient2 = new PublicKey(
    'AV4t7jLvLrVxHCqTGrfWaGz3zoNdSCuWjbqd3i9hSkD7',
  ).toBase58();
  // Unicast
  await dapp.messages.send({
    title: 'Hello',
    message: 'Hello, world',
    recipient,
  });
  // Multicast
  await dapp.messages.send({
    title: 'Hello',
    message: 'Hello, world',
    recipients: [recipient, recipient2],
  });
  // Broadcast, in this case notification is sent to all dapp subscribers using all user-enabled notification channels
  await dapp.messages.send({
    title: 'Hello',
    message: 'Hello, world',
  });

  // Unicast, but only to wallet channel (Dialect, Solflare or Step inboxes)
  await dapp.messages.send({
    title: 'Hello, dialectooooor',
    message: 'Hello, world',
    recipient,
    addressTypes: [AddressType.Wallet],
  });

  // Multicast, but only to wallet channel (Dialect, Solflare or Step inboxes)
  await dapp.messages.send({
    title: 'Hello, telegramoooors',
    message: 'Hello, world',
    recipients: [recipient, recipient2],
    addressTypes: [AddressType.Telegram],
  });

  // Per-channel broadcast, in this case notification is sent all dapp subscribers but to only specificied channels, e.g. telegram, sms, email, wallet
  await dapp.messages.send({
    title: 'Hello to sms and telegram subscribers',
    message: 'Hello, world',
    addressTypes: [AddressType.Telegram, AddressType.PhoneNumber],
  });
})();
