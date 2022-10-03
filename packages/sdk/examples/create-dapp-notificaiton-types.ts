import { Dialect, IllegalStateError } from '@dialectlabs/sdk';
import {
  NodeDialectSolanaWalletAdapter,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';

(async () => {
  const sdk = Dialect.sdk(
    {
      // 'production' | 'development' | 'local-development'
      environment: 'local-development',
      // DIALECT_SDK_CREDENTIALS env var is consumed by create() and should be used to act on behalf of your dapp private key
    },
    SolanaSdkFactory.create({
      wallet: NodeDialectSolanaWalletAdapter.create(),
    }),
  );
  const dapp = await sdk.dapps.find();
  if (!dapp) {
    throw new IllegalStateError(
      "Dapp doesn't exist, please create dapp before using it",
    );
  }
  const notificationType = await dapp.notificationTypes.create({
    humanReadableId: 'announcements',
    name: 'Announcements',
    orderingPriority: 0,
    trigger: 'Notification description or triggering event/conditions',
    defaultConfig: {
      enabled: true,
    },
  });
  console.log(JSON.stringify(notificationType));
  const all = await dapp.notificationTypes.findAll();
  console.log(JSON.stringify(all));
  const patched = await dapp.notificationTypes.patch(notificationType.id, {
    name: 'New feature announcements',
  });
  console.log(JSON.stringify(patched));
})();
