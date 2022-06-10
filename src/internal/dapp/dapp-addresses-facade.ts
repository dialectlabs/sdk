import type { DappAddress, DappAddresses } from '@dapp/dapp.interface';
import { AddressType } from '@dapp/dapp.interface';
import { PublicKey } from '@solana/web3.js';
import { IllegalArgumentError } from '@sdk/errors';

export class DappAddressesFacade implements DappAddresses {
  constructor(private readonly dappAddressesBackends: DappAddresses[]) {
    if (dappAddressesBackends.length < 1) {
      throw new IllegalArgumentError(
        'Expected to have at least one dapp addresses backend.',
      );
    }
  }

  async findAll(): Promise<DappAddress[]> {
    const allSettled = await Promise.allSettled(
      this.dappAddressesBackends.map((it) => it.findAll()),
    );
    const rejected = allSettled.filter((it) => it.status === 'rejected');
    if (rejected.length > 0) {
      console.error(
        `Error during finding dapp addresses: ${rejected
          .map((it) => it as PromiseRejectedResult)
          .map((it) => JSON.stringify(it.reason))}`,
      );
    }
    const allDappAddresses = allSettled
      .filter((it) => it.status === 'fulfilled')
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

  private static dedupleWalletAddresses(walletAddresses: DappAddress[]) {
    const walletPublicKeyToWalletAddresses = groupBy(walletAddresses, (it) =>
      it.address.walletPublicKey.toBase58(),
    );
    const deduplicatedWalletAddresses: DappAddress[] = Object.entries(
      walletPublicKeyToWalletAddresses,
    ).map(([walletPublicKey, walletDappAddresses]) =>
      walletDappAddresses.reduce((prev, curr) => ({
        enabled: prev.enabled || curr.enabled,
        address: {
          value: walletPublicKey,
          walletPublicKey: new PublicKey(walletPublicKey),
          verified: true,
          type: curr.address.type,
        },
      })),
    );
    return deduplicatedWalletAddresses;
  }
}

function groupBy<T, K extends keyof any>(arr: T[], key: (i: T) => K) {
  return arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);
}
