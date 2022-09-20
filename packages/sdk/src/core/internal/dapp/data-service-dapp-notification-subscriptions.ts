import type {
  DappNotificationSubscription,
  DappNotificationSubscriptions,
} from '../../dapp/dapp.interface';
import type { DataServiceDappNotificationSubscriptionsApi } from '../../../data-service-api/data-service-dapp-notification-subscriptions-api';
import { withErrorParsing } from '../../../data-service-api/data-service-errors';

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
          address: it.wallet.publicKey,
        },
      })),
    }));
  }
}
