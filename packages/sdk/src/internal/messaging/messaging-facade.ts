import type {
  CreateThreadCommand,
  FindThreadByOtherMemberQuery,
  FindThreadQuery,
  Messaging,
  Thread,
  ThreadsGeneralSummary,
  ThreadSummary,
} from '@messaging/messaging.interface';
import {
  DialectSdkError,
  IllegalArgumentError,
  IllegalStateError,
} from '@sdk/errors';
import type { Backend } from '@sdk/sdk.interface';

export interface MessagingBackend {
  messaging: Messaging;
  backend: Backend;
}

export class MessagingFacade implements Messaging {
  constructor(private readonly messagingBackends: MessagingBackend[]) {
    if (messagingBackends.length < 1) {
      throw new IllegalArgumentError(
        'Expected to have at least on messaging backend.',
      );
    }
  }

  create(command: CreateThreadCommand): Promise<Thread> {
    const { messaging } = this.getPreferableMessaging(command.backend);
    return messaging.create(command);
  }

  private getPreferableMessaging(backend?: Backend) {
    if (backend) {
      return this.lookUpMessagingBackend(backend);
    }
    return this.getFirstAccordingToPriority();
  }

  private lookUpMessagingBackend(backend: Backend) {
    const messagingBackend = this.messagingBackends.find(
      ({ backend: b }) => backend === b,
    );
    if (!messagingBackend) {
      throw new IllegalArgumentError(
        `Backend ${backend} is not configured in sdk.`,
      );
    }
    return messagingBackend;
  }

  private getFirstAccordingToPriority() {
    const messaging = this.messagingBackends[0];
    if (!messaging) {
      throw new IllegalStateError('Should not happen.');
    }
    return messaging;
  }

  async find(query: FindThreadQuery): Promise<Thread | null> {
    if ('id' in query && query.id.backend) {
      const { messaging } = this.lookUpMessagingBackend(query.id.backend);
      return messaging.find(query);
    }
    for (const { messaging } of this.messagingBackends) {
      try {
        const thread = await messaging.find(query);
        if (thread) {
          return thread;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }

  async findAll(): Promise<Thread[]> {
    const allSettled = await Promise.allSettled(
      this.messagingBackends.map(({ messaging }) => messaging.findAll()),
    );
    const errors = allSettled
      .filter((it) => it.status === 'rejected')
      .map((it) => it as PromiseRejectedResult)
      .map((it) => it.reason as DialectSdkError);
    if (errors.length > 0) {
      console.error(
        `Error during finding dialects: ${errors.map((it) =>
          JSON.stringify(it),
        )}`,
      );
    }
    const fulfilled = allSettled.filter((it) => it.status === 'fulfilled');
    if (errors.length > 0 && fulfilled.length === 0) {
      const error: DialectSdkError = {
        ...errors[0]!,
        details: errors,
      };
      throw error;
    }
    return fulfilled
      .map((it) => it as PromiseFulfilledResult<Thread[]>)
      .map((it) => it.value)
      .flat()
      .sort((t1, t2) => t2.updatedAt.getTime() - t1.updatedAt.getTime());
  }

  async findSummary(
    query: FindThreadByOtherMemberQuery,
  ): Promise<ThreadSummary | null> {
    for (const { messaging } of this.messagingBackends) {
      try {
        const thread = await messaging.findSummary(query);
        if (thread) {
          return thread;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }

  async findSummaryAll(): Promise<ThreadsGeneralSummary | null> {
    for (const { messaging } of this.messagingBackends) {
      try {
        const summary = await messaging.findSummaryAll();
        if (summary) {
          return summary;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  }
}
