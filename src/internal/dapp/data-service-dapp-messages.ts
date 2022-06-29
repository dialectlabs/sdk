import type {
  BroadcastMessageCommand,
  DappMessages,
  MulticastMessageCommand,
  SendMessageCommand,
  UnicastMessageCommand,
} from '@dapp/dapp.interface';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import { withErrorParsing } from '@data-service-api/data-service-errors';

export class DataServiceDappMessages implements DappMessages {
  constructor(private readonly api: DataServiceDappsApi) {}

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
    return withErrorParsing(
      this.api.unicast({
        ...command,
        recipientPublicKey: command.recipient.toBase58(),
      }),
    );
  }

  private async multicast(command: MulticastMessageCommand) {
    return withErrorParsing(
      this.api.multicast({
        ...command,
        recipientPublicKeys: command.recipients.map((it) => it.toBase58()),
      }),
    );
  }

  private async broadcast(command: BroadcastMessageCommand) {
    return withErrorParsing(
      this.api.broadcast({
        ...command,
      }),
    );
  }
}
