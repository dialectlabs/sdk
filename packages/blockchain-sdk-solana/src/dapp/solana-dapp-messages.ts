import type {
  AccountAddress,
  DappMessages,
  MulticastDappMessageCommand,
  SendDappMessageCommand,
  UnicastDappMessageCommand,
} from '@dialectlabs/sdk';
import type { SolanaMessaging } from '../messaging/solana-messaging';
import type { SolanaDappAddresses } from './solana-dapp-addresses';

export class SolanaDappMessages implements DappMessages {
  constructor(
    private readonly messaging: SolanaMessaging,
    private readonly dappAddresses: SolanaDappAddresses,
  ) {}

  async send(command: SendDappMessageCommand): Promise<void> {
    if (Boolean(command.notificationTypeId)) {
      console.warn(
        `Ignoring notificationTypeId: ${command.notificationTypeId}, not implemented`,
      );
    }
    if ('recipient' in command) {
      const recipients = await this.getRecipients(
        (it) => it === command.recipient,
      );
      return this.multicast({
        ...command,
        recipients,
      });
    }
    if ('recipients' in command) {
      const recipients = await this.getRecipients((r) =>
        Boolean(command.recipients.find((it) => it === r)),
      );
      return this.multicast({
        ...command,
        recipients,
      });
    }
    const recipients = await this.getRecipients();
    return this.multicast({
      ...command,
      recipients,
    });
  }

  async getRecipients(
    recipientPredicate: (recipient: AccountAddress) => boolean = () => true,
  ) {
    const addressRecipients = await this.getRecipientsByAddressSubscription(
      recipientPredicate,
    );
    if (addressRecipients.length === 0) {
      return [];
    }
    return addressRecipients;
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

  private async getRecipientsByAddressSubscription(
    recipientPredicate: (recipient: AccountAddress) => boolean,
  ) {
    const addressSubscriptions = await this.dappAddresses.findAll();
    return addressSubscriptions
      .filter((it) => it.address.verified && it.enabled)
      .map((it) => it.address.wallet.address)
      .filter(recipientPredicate);
  }
}
