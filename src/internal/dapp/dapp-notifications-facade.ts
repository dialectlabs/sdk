import type {
  DappNotifications,
  SendNotificationCommand,
} from '@dapp/dapp.interface';
import { IllegalArgumentError } from '@sdk/errors';

export class DappNotificationsFacade implements DappNotifications {
  constructor(private readonly dappNotificationBackends: DappNotifications[]) {
    if (dappNotificationBackends.length < 1) {
      throw new IllegalArgumentError(
        'Expected to have at least one dapp notifications backend.',
      );
    }
  }

  async send(command: SendNotificationCommand): Promise<void> {
    const allSettled = await Promise.allSettled(
      this.dappNotificationBackends.map((it) => it.send(command)),
    );
    const rejected = allSettled.filter((it) => it.status === 'rejected');
    if (rejected.length > 0) {
      console.error(
        `Error during sending dapp notifications: ${rejected
          .map((it) => it as PromiseRejectedResult)
          .map((it) => JSON.stringify(it.reason))}`,
      );
    }
  }
}
