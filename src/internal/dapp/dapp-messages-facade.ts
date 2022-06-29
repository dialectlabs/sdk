import type {
  DappMessages,
  SendDappMessageCommand,
} from '@dapp/dapp.interface';
import { IllegalArgumentError } from '@sdk/errors';

export class DappMessagesFacade implements DappMessages {
  constructor(private readonly dappMessageBackends: DappMessages[]) {
    if (dappMessageBackends.length < 1) {
      throw new IllegalArgumentError(
        'Expected to have at least one dapp message backend.',
      );
    }
  }

  async send(command: SendDappMessageCommand): Promise<void> {
    const allSettled = await Promise.allSettled(
      this.dappMessageBackends.map((it) => it.send(command)),
    );
    const rejected = allSettled.filter((it) => it.status === 'rejected');
    if (rejected.length > 0) {
      console.error(
        `Error during sending dapp messages: ${rejected
          .map((it) => it as PromiseRejectedResult)
          .map((it) => JSON.stringify(it.reason))}`,
      );
    }
  }
}
