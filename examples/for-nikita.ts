import { Dialect, NodeDialectWalletAdapter } from '../src';
import { Keypair } from '@solana/web3.js';

(async () => {
  const wallet = NodeDialectWalletAdapter.create();
  const sdk = Dialect.sdk({ wallet });

  // find unread messages unauthenticated
  const walletPublicKey = Keypair.generate().publicKey;
  const dappPublicKey = Keypair.generate().publicKey;
  const summary = await sdk.threads.findSummary({
    me: walletPublicKey,
    otherMembers: [dappPublicKey],
  })!;
  const hasUnreadMessages = summary.me.hasUnreadMessages;
  // set unread message time
  const thread = await sdk.threads.find({
    otherMembers: [dappPublicKey],
  })!;
  const messages = await thread.messages();
  const message = messages[0];
  await thread.setLastReadMessageTime(message.timestamp);
  // check unread messages
  const lastReadMessageTimestamp = thread.me.lastReadMessageTimestamp;
})();
