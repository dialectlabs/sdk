import type {
  DappMessages,
  SendDappMessageCommand,
} from '../../core/dapp/dapp.interface';
import { DialectSdkError, IllegalArgumentError } from '../../sdk/errors';

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
    const errors = allSettled
      .filter((it) => it.status === 'rejected')
      .map((it) => it as PromiseRejectedResult)
      .map((it) => it.reason as DialectSdkError);
    if (errors.length > 0) {
      console.error(
        `Error during sending dapp messages: ${errors.map((it) =>
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
  }
}
