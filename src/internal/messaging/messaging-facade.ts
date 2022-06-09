import type {
  CreateThreadCommand,
  FindThreadQuery,
  Messaging,
  Thread,
} from '@messaging/messaging.interface';
import { IllegalArgumentError } from '@sdk/errors';
import { MessagingBackend } from '@sdk/sdk.interface';
import { requireSingleMember } from '@messaging/internal/commons';

export class MessagingFacade implements Messaging {
  constructor(
    private readonly dataServiceMessaging: Messaging,
    private readonly solanaMessaging: Messaging,
    private readonly preferableMessagingBackend: MessagingBackend,
  ) {}

  create(command: CreateThreadCommand): Promise<Thread> {
    if (this.preferableMessagingBackend === MessagingBackend.Solana) {
      return this.solanaMessaging.create(command);
    }
    if (this.preferableMessagingBackend === MessagingBackend.DialectCloud) {
      return this.dataServiceMessaging.create(command);
    }
    throw new IllegalArgumentError(
      `Unsupported messaging backend ${this.preferableMessagingBackend}`,
    );
  }

  async find(query: FindThreadQuery): Promise<Thread | null> {
    if (this.preferableMessagingBackend === MessagingBackend.Solana) {
      return (
        (await this.solanaMessaging.find(query)) ||
        (await this.dataServiceMessaging.find(query))
      );
    }
    if (this.preferableMessagingBackend === MessagingBackend.DialectCloud) {
      return (
        (await this.dataServiceMessaging.find(query)) ||
        (await this.solanaMessaging.find(query))
      );
    }
    throw new IllegalArgumentError(
      `Unsupported messaging backend ${this.preferableMessagingBackend}`,
    );
  }

  async findAll(): Promise<Thread[]> {
    const allSettled = await Promise.allSettled([
      this.solanaMessaging.findAll(),
      this.dataServiceMessaging.findAll(),
    ]);
    const fulfilled = allSettled.filter((it) => it.status === 'fulfilled');
    const rejected = allSettled.filter((it) => it.status === 'rejected');
    if (rejected.length > 0) {
      console.error(
        `Error during finding dialects: ${rejected
          .map((it) => it as PromiseRejectedResult)
          .map((it) => it.reason)}`,
      );
    }
    return fulfilled
      .map((it) => it as PromiseFulfilledResult<Thread[]>)
      .map((it) => it.value)
      .flat()
      .sort((t1, t2) => t2.updatedAt.getTime() - t1.updatedAt.getTime());
  }
}
