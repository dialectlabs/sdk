import {
  type BroadcastDappMessageCommand,
  DappMessageActionType,
  type DappMessageLinksAction,
  type DappMessages,
  type DappMessageSmartMessageAction,
  type MulticastDappMessageCommand,
  type SendDappMessageCommand,
  type UnicastDappMessageCommand,
} from '../../dapp/dapp.interface';
import { toAddressTypeDto } from '../../address/addresses.interface';
import {
  DappMessageActionTypeDto,
  DappMessageLinksActionDto,
  DappMessageSmartMessageActionDto,
  type DataServiceDappsApi,
} from '../../dialect-cloud-api/data-service-dapps-api';
import { withErrorParsing } from '../../dialect-cloud-api/data-service-errors';

export class DataServiceDappMessages implements DappMessages {
  constructor(private readonly api: DataServiceDappsApi) {
  }

  async send(command: SendDappMessageCommand): Promise<void> {
    if (command.addressTypes?.length === 0) {
      return;
    }
    if ('recipient' in command) {
      return this.unicast(command);
    }
    if ('recipients' in command) {
      return this.multicast(command);
    }
    return this.broadcast(command);
  }

  private async unicast(command: UnicastDappMessageCommand) {


    const actionsV2Dto = this.getActionsV2DtoForUnicast(command.actionsV2);
    return withErrorParsing(
      this.api.unicast({
        message: command.message,
        title: command.title,
        imageUrl: command.imageUrl,
        notificationTypeId: command.notificationTypeId,
        recipientPublicKey: command.recipient.toString(),
        addressTypes: command?.addressTypes?.map((addr) =>
          toAddressTypeDto(addr),
        ),
        actionsV2: actionsV2Dto,
      }),
    );
  }

  private getActionsV2DtoForUnicast(actions?: DappMessageLinksAction | DappMessageSmartMessageAction): DappMessageLinksActionDto | DappMessageSmartMessageActionDto | undefined {
    if (!actions?.type) {
      return;
    }
    if (actions.type === DappMessageActionType.LINK) {
      return {
        type: DappMessageActionTypeDto.LINK,
        links: actions.links.map((link) => ({
          label: link.label,
          url: link.url,
        })),
      };
    }
    if (actions.type === DappMessageActionType.SMART_MESSAGE) {
      return {
        type: DappMessageActionTypeDto.SMART_MESSAGE,
        smartMessage: {
          transactionServiceId: actions.smartMessage.transactionServiceId,
          transactionParams: actions.smartMessage.transactionParams,
        },
      };
    }
  }

  private async multicast(command: MulticastDappMessageCommand) {
    if (command.recipients.length === 0) {
      return;
    }
    return withErrorParsing(
      this.api.multicast({
        message: command.message,
        title: command.title,
        imageUrl: command.imageUrl,
        actionsV2: this.getActionsV2DtoForLinks(command.actionsV2),
        notificationTypeId: command.notificationTypeId,
        recipientPublicKeys: command.recipients.map((it) => it.toString()),
        addressTypes: command?.addressTypes?.map((addr) =>
          toAddressTypeDto(addr),
        ),
      }),
    );
  }

  private async broadcast(command: BroadcastDappMessageCommand) {
    return withErrorParsing(
      this.api.broadcast({
        message: command.message,
        title: command.title,
        imageUrl: command.imageUrl,
        actionsV2: this.getActionsV2DtoForLinks(command.actionsV2),
        notificationTypeId: command.notificationTypeId,
        addressTypes: command?.addressTypes?.map((addr) =>
          toAddressTypeDto(addr),
        ),
      }),
    );
  }

  private getActionsV2DtoForLinks(actions?: DappMessageLinksAction): DappMessageLinksActionDto | undefined {
    if (!actions?.type) {
      return;
    }
    return {
      type: DappMessageActionTypeDto.LINK,
      links: actions.links.map((link) => ({
        label: link.label,
        url: link.url,
      })),
    };
  }
}
