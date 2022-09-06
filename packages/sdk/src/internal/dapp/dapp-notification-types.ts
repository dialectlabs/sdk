import type { DataServiceDappNotificationTypesApi } from '../data-service-api/data-service-dapp-notification-types-api';
import type {
  CreateNotificationTypeCommand,
  DappNotificationTypes,
  PatchNotificationTypeCommand,
} from '../../core/dapp/dapp.interface';
import type { NotificationType } from '../../core/wallet/wallet.interface';
import { withErrorParsing } from '../data-service-api/data-service-errors';

export class DataServiceDappNotificationTypes implements DappNotificationTypes {
  constructor(private readonly api: DataServiceDappNotificationTypesApi) {}

  async create(
    command: CreateNotificationTypeCommand,
  ): Promise<NotificationType> {
    const dto = await withErrorParsing(this.api.create(command));
    return {
      ...dto,
    };
  }

  async delete(id: string): Promise<void> {
    await withErrorParsing(this.api.delete(id));
  }

  async find(id: string): Promise<NotificationType> {
    const dto = await withErrorParsing(this.api.find(id));
    return {
      ...dto,
    };
  }

  async findAll(): Promise<NotificationType[]> {
    const dtos = await withErrorParsing(this.api.findAll());
    return dtos.map((it) => ({
      ...it,
    }));
  }

  async patch(
    id: string,
    command: PatchNotificationTypeCommand,
  ): Promise<NotificationType> {
    const dto = await withErrorParsing(this.api.patch(id, command));
    return {
      ...dto,
    };
  }
}
