import type {
  BroadcastSendNotificationCommand,
  DappNotifications,
  MulticastSendNotificationCommand,
  SendNotificationCommand,
  UnicastSendNotificationCommand,
} from '@dapp/dapp.interface';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import { withErrorParsing } from '@data-service-api/data-service-errors';

export class DataServiceDappNotifications implements DappNotifications {
  constructor(private readonly api: DataServiceDappsApi) {}

  async send(command: SendNotificationCommand): Promise<void> {
    if ('receiver' in command) {
      return this.unicast(command);
    }
    if ('receivers' in command) {
      return this.multicast(command);
    }
    return this.broadcast(command);
  }

  private async unicast(command: UnicastSendNotificationCommand) {
    return withErrorParsing(
      this.api.unicast({
        ...command,
        receiverPublicKey: command.receiver.toBase58(),
      }),
    );
  }

  private async multicast(command: MulticastSendNotificationCommand) {
    return withErrorParsing(
      this.api.multicast({
        ...command,
        receiverPublicKeys: command.receivers.map((it) => it.toBase58()),
      }),
    );
  }

  private async broadcast(command: BroadcastSendNotificationCommand) {
    return withErrorParsing(
      this.api.broadcast({
        ...command,
      }),
    );
  }
}
