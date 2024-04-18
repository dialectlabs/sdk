import type { DappAddress } from '../../address/addresses.interface';
import { AddressType } from '../../address/addresses.interface';
import { DialectSdkError, IllegalArgumentError } from '../../sdk/errors';
import type { DappAddresses } from '../../dapp/dapp.interface';
import { groupBy } from '../../utils/collection-utils';

export class DappAddressesFacade implements DappAddresses {
  constructor(private readonly dappAddressesBackends: DappAddresses[]) {
    if (dappAddressesBackends.length < 1) {
      throw new IllegalArgumentError(
        'Expected to have at least one dapp addresses backend.',
      );
    }
  }

  private static dedupleWalletAddresses(walletAddresses: DappAddress[]) {
    const walletPublicKeyToWalletAddresses = groupBy(walletAddresses, (it) =>
      it.address.wallet.address.toString(),
    );
    const deduplicatedWalletAddresses: DappAddress[] = Object.entries(
      walletPublicKeyToWalletAddresses,
    ).map(([walletPublicKey, walletDappAddresses]) =>
      walletDappAddresses.reduce((prev, curr) => ({
        id: prev.id,
        enabled: prev.enabled && curr.enabled,
        dappId: prev.dappId,
        address: {
          id: prev.id,
          value: walletPublicKey,
          verified: true,
          type: prev.address.type,
          wallet: {
            address: walletPublicKey,
          },
        },
      })),
    );
    return deduplicatedWalletAddresses;
  }

  async findAll(): Promise<DappAddress[]> {
    const allSettled = await Promise.allSettled(
      this.dappAddressesBackends.map((it) => it.findAll()),
    );
    const errors = allSettled
      .filter((it) => it.status === 'rejected')
      .map((it) => it as PromiseRejectedResult)
      .map((it) => it.reason as DialectSdkError);
    if (errors.length > 0) {
      console.error(
        `Error during finding dapp addresses: ${errors.map((it) =>
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
    const allDappAddresses = fulfilled
      .map((it) => it as PromiseFulfilledResult<DappAddress[]>)
      .map((it) => it.value)
      .flat();
    const walletAddresses = allDappAddresses.filter(
      (it) => it.address.type === AddressType.Wallet,
    );
    const deduplicatedWalletAddresses =
      DappAddressesFacade.dedupleWalletAddresses(walletAddresses);
    const nonWalletAddresses = allDappAddresses.filter(
      (it) => it.address.type !== AddressType.Wallet,
    );
    return Promise.resolve([
      ...nonWalletAddresses,
      ...deduplicatedWalletAddresses,
    ]);
  }
}
