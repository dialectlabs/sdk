import type {
  CreateThreadCommand,
  FindThreadByOtherMemberQuery,
  FindThreadQuery,
  Messaging,
  Thread,
  ThreadsGeneralSummary,
  ThreadSummary,
} from '../../messaging/messaging.interface';
import {
  DialectSdkError,
  IllegalArgumentError,
  IllegalStateError,
} from '../../sdk/errors';

export class MessagingFacade implements Messaging {
  readonly type = 'messaging-facade';

  constructor(private readonly delegates: Messaging[]) {
    if (delegates.length < 1) {
      throw new IllegalArgumentError(
        'Expected to have at least on messaging backend.',
      );
    }
  }

  create(command: CreateThreadCommand): Promise<Thread> {
    const messaging = this.getPreferableMessaging(command.type);
    return messaging.create(command);
  }

  async find(query: FindThreadQuery): Promise<Thread | null> {
    if ('id' in query && query.id.type) {
      const messaging = this.lookUpMessagingBackend(query.id.type);
      return messaging.find(query);
    }
    for (const messaging of this.delegates) {
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
      this.delegates.map((messaging) => messaging.findAll()),
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
    for (const messaging of this.delegates) {
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
    for (const messaging of this.delegates) {
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

  private getPreferableMessaging(type?: string) {
    if (type) {
      return this.lookUpMessagingBackend(type);
    }
    return this.getFirstAccordingToPriority();
  }

  private lookUpMessagingBackend(type: string) {
    const messagingBackend = this.delegates.find(({ type: t }) => type === t);
    if (!messagingBackend) {
      throw new IllegalArgumentError(
        `Backend ${type} is not configured in sdk.`,
      );
    }
    return messagingBackend;
  }

  private getFirstAccordingToPriority() {
    const messaging = this.delegates[0];
    if (!messaging) {
      throw new IllegalStateError('Should not happen.');
    }
    return messaging;
  }
}
