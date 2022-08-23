import type { DappNotificationSubscriptions } from '@dapp/dapp.interface';
import type { DappNotificationSubscription } from '@dapp/dapp.interface';
import { withErrorParsing } from '@data-service-api/data-service-errors';
import type { DataServiceDappNotificationSubscriptionsApi } from '@data-service-api/data-service-dapp-notification-subscriptions-api';
import { PublicKey } from '@solana/web3.js';

export class DataServiceDappNotificationSubscriptions
  implements DappNotificationSubscriptions
{
  constructor(
    private readonly api: DataServiceDappNotificationSubscriptionsApi,
  ) {}

  async findAll(): Promise<DappNotificationSubscription[]> {
    const dtos = await withErrorParsing(this.api.findAll());
    return dtos.map((it) => ({
      ...it,
      subscriptions: it.subscriptions.map((it) => ({
        ...it,
        wallet: {
          ...it.wallet,
          publicKey: new PublicKey(it.wallet.publicKey),
        },
      })),
    }));
  }
}
