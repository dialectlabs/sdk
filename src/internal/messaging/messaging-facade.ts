import type {
  CreateThreadCommand,
  FindThreadQuery,
  Messaging,
  Thread,
} from '@messaging/messaging.interface';
import { IllegalArgumentError, IllegalStateError } from '@sdk/errors';

export class MessagingFacade implements Messaging {
  constructor(private readonly messagingBackends: Messaging[]) {
    if (messagingBackends.length < 1) {
      throw new IllegalArgumentError(
        'Expected to have at least on messaging backend.',
      );
    }
  }

  create(command: CreateThreadCommand): Promise<Thread> {
    const messaging = this.getPreferableMessaging();
    return messaging.create(command);
  }

  private getPreferableMessaging() {
    const messaging = this.messagingBackends[0];
    if (!messaging) {
      throw new IllegalStateError('Should not happen.');
    }
    return messaging;
  }

  async find(query: FindThreadQuery): Promise<Thread | null> {
    for (const messaging of this.messagingBackends) {
      const thread = await messaging.find(query);
      if (thread) {
        return thread;
      }
    }
    return null;
  }

  async findAll(): Promise<Thread[]> {
    const allSettled = await Promise.allSettled(
      this.messagingBackends.map((it) => it.findAll()),
    );
    const fulfilled = allSettled.filter((it) => it.status === 'fulfilled');
    const rejected = allSettled.filter((it) => it.status === 'rejected');
    if (rejected.length > 0) {
      console.error(
        `Error during finding dialects: ${rejected
          .map((it) => it as PromiseRejectedResult)
          .map((it) => JSON.stringify(it.reason))}`,
      );
    }
    return fulfilled
      .map((it) => it as PromiseFulfilledResult<Thread[]>)
      .map((it) => it.value)
      .flat()
      .sort((t1, t2) => t2.updatedAt.getTime() - t1.updatedAt.getTime());
  }
}
