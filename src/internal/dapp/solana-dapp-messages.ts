import type {
  BroadcastMessageCommand,
  DappMessages,
  MulticastMessageCommand,
  SendMessageCommand,
  UnicastMessageCommand,
} from '@dapp/dapp.interface';
import type { SolanaMessaging } from '@messaging/internal/solana-messaging';
import type { SolanaDappAddresses } from '@dapp/internal/solana-dapp-addresses';
import { PublicKey } from '@solana/web3.js';
import { AddressType } from '@address/addresses.interface';

export class SolanaDappMessages implements DappMessages {
  constructor(
    private readonly messaging: SolanaMessaging,
    private readonly dappAddresses: SolanaDappAddresses,
  ) {}

  async send(command: SendMessageCommand): Promise<void> {
    if ('recipient' in command) {
      return this.unicast(command);
    }
    if ('recipients' in command) {
      return this.multicast(command);
    }
    return this.broadcast(command);
  }

  private async unicast(command: UnicastMessageCommand) {
    const thread = await this.messaging.find({
      otherMembers: [command.recipient],
    });
    if (thread) {
      return thread.send({
        text: command.message,
      });
    }
  }

  private async multicast(command: MulticastMessageCommand) {
    const allSettled = await Promise.allSettled(
      command.recipients.map((it) =>
        this.unicast({
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
          .map((it) => JSON.stringify(it.reason))}`,
      );
    }
  }

  private async broadcast(command: BroadcastMessageCommand) {
    const dappAddresses = await this.dappAddresses.findAll();
    return this.multicast({
      ...command,
      recipients: dappAddresses
        .filter((it) => it.address.type === AddressType.Wallet)
        .map((it) => new PublicKey(it.address.value)),
    });
  }
}
