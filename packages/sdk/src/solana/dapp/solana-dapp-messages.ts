import type {
  DappMessages,
  DappNotificationSubscriptions,
  DappNotificationTypes,
  MulticastDappMessageCommand,
  SendDappMessageCommand,
  UnicastDappMessageCommand,
} from '../../core/dapp/dapp.interface';
import type { PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { IllegalArgumentError } from '../../core/sdk/errors';
import type { SolanaMessaging } from '../messaging/solana-messaging';
import type { SolanaDappAddresses } from './solana-dapp-addresses';
import type { PublicKey } from '../../core/auth/auth.interface';

export class SolanaDappMessages implements DappMessages {
  constructor(
    private readonly messaging: SolanaMessaging,
    private readonly dappAddresses: SolanaDappAddresses,
    private readonly dappNotificationTypes: DappNotificationTypes,
    private readonly notificationSubscriptions: DappNotificationSubscriptions,
  ) {}

  async send(command: SendDappMessageCommand): Promise<void> {
    if ('recipient' in command) {
      const recipients = await this.getRecipients(
        command.notificationTypeId,
        (it) => it.equals(command.recipient),
      );
      return this.multicast({
        ...command,
        recipients,
      });
    }
    if ('recipients' in command) {
      const recipients = await this.getRecipients(
        command.notificationTypeId,
        (r) => Boolean(command.recipients.find((it) => it.equals(r))),
      );
      return this.multicast({
        ...command,
        recipients,
      });
    }
    const recipients = await this.getRecipients(command.notificationTypeId);
    return this.multicast({
      ...command,
      recipients,
    });
  }

  private async multicast(command: MulticastDappMessageCommand) {
    const allSettled = await Promise.allSettled(
      command.recipients.map((it) =>
        this.sendInternal({
          ...command,
          recipient: it,
        }),
      ),
    );
    const rejected = allSettled.filter((it) => it.status === 'rejected');
    if (rejected.length > 0) {
      console.error(
        `Error during sending solana dapp messages: ${rejected
          .map((it) => it as PromiseRejectedResult)
          .map((it) => JSON.stringify(it.reason))
          .join('\n')}`,
      );
    }
  }

  private async sendInternal(command: UnicastDappMessageCommand) {
    const thread = await this.messaging.find({
      otherMembers: [command.recipient],
    });
    if (thread) {
      return thread.send({
        text: command.message,
      });
    }
  }

  async getRecipients(
    notificationTypeId?: string,
    recipientPredicate: (recipient: PublicKey) => boolean = () => true,
  ) {
    const dappNotificationTypes = await this.dappNotificationTypes.findAll();
    if (dappNotificationTypes.length > 0 && !notificationTypeId) {
      throw new IllegalArgumentError(
        `Dapp has non-empty notification type configuration, therefore notification type id must be supplied`,
      );
    }
    const addressRecipients = await this.getRecipientsByAddressSubscription(
      recipientPredicate,
    );
    if (addressRecipients.length === 0) {
      return [];
    }
    if (!notificationTypeId) {
      return addressRecipients;
    }
    const notificationTypeRecipients =
      await this.getRecipientsByNotificationType(
        notificationTypeId,
        recipientPredicate,
      );
    return notificationTypeRecipients.filter((ntr) =>
      addressRecipients.find((ar) => ar.equals(ntr)),
    );
  }

  private async getRecipientsByAddressSubscription(
    recipientPredicate: (recipient: PublicKey) => boolean,
  ) {
    const addressSubscriptions = await this.dappAddresses.findAll();
    return addressSubscriptions
      .filter((it) => it.address.verified && it.enabled)
      .map((it) => it.address.wallet.publicKey)
      .filter(recipientPredicate);
  }

  private async getRecipientsByNotificationType(
    notificationTypeId: string,
    recipientPredicate: (recipient: PublicKey) => boolean,
  ) {
    const notificationSubscriptions =
      await this.notificationSubscriptions.findAll();
    return notificationSubscriptions
      .filter(
        (it) =>
          it.notificationType.id === notificationTypeId ||
          it.notificationType.humanReadableId.toLowerCase() ===
            notificationTypeId.toLowerCase(),
      )
      .flatMap((it) => it.subscriptions)
      .filter((it) => it.config.enabled)
      .map((it) => it.wallet.publicKey)
      .filter(recipientPredicate);
  }
}
