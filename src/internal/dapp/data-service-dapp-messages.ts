import type {
  BroadcastDappMessageCommand,
  DappMessages,
  MulticastDappMessageCommand,
  SendDappMessageCommand,
  UnicastDappMessageCommand,
} from '@dapp/dapp.interface';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import { withErrorParsing } from '@data-service-api/data-service-errors';

export class DataServiceDappMessages implements DappMessages {
  constructor(private readonly api: DataServiceDappsApi) {}

  async send(command: SendDappMessageCommand): Promise<void> {
    if ('recipient' in command) {
      return this.unicast(command);
    }
    if ('recipients' in command) {
      return this.multicast(command);
    }
    return this.broadcast(command);
  }

  private async unicast(command: UnicastDappMessageCommand) {
    return withErrorParsing(
      this.api.unicast({
        ...command,
        notificationTypeId: command.notificationTypeId,
        recipientPublicKey: command.recipient.toBase58(),
      }),
    );
  }

  private async multicast(command: MulticastDappMessageCommand) {
    return withErrorParsing(
      this.api.multicast({
        ...command,
        notificationTypeId: command.notificationTypeId,
        recipientPublicKeys: command.recipients.map((it) => it.toBase58()),
      }),
    );
  }

  private async broadcast(command: BroadcastDappMessageCommand) {
    return withErrorParsing(
      this.api.broadcast({
        ...command,
        notificationTypeId: command.notificationTypeId,
      }),
    );
  }
}
