import type {
  CreateAddressCommand,
  DeleteAddressCommand,
  FindWalletDappAddressQuery,
  Wallet,
  WalletAddresses,
} from '@wallet/wallet.interface';
import type { PublicKey } from '@solana/web3.js';
import type { DappAddress } from '@address/addresses.interface';
import { toAddressType } from '@address/addresses.interface';
import type {
  DappAddressDtoV0,
  DataServiceWalletsApiV0,
} from '@data-service-api/data-service-wallets-api';
import { withErrorParsing } from '@data-service-api/data-service-errors';

export class DataServiceWallet implements Wallet {
  addresses: WalletAddresses;

  constructor(
    readonly publicKey: PublicKey,
    private readonly dataServiceWalletsApi: DataServiceWalletsApiV0,
  ) {
    this.addresses = new DataServiceWalletAddresses(
      publicKey,
      dataServiceWalletsApi,
    );
  }
}

export class DataServiceWalletAddresses implements WalletAddresses {
  constructor(
    private readonly publicKey: PublicKey,
    private readonly dataServiceWalletsApi: DataServiceWalletsApiV0,
  ) {}

  async create(command: CreateAddressCommand): Promise<DappAddress> {
    const dappAddressDto = await withErrorParsing(
      this.dataServiceWalletsApi.createDappAddress(
        {
          ...command,
        },
        command.dappPublicKey.toBase58(),
      ),
    );
    return this.toDappAddress(dappAddressDto);
  }

  private toDappAddress(dappAddressDto: DappAddressDtoV0): DappAddress {
    return {
      id: dappAddressDto.id,
      telegramChatId: null,
      enabled: dappAddressDto.enabled,
      address: {
        id: dappAddressDto.addressId,
        type: toAddressType(dappAddressDto.type),
        value: dappAddressDto.value,
        verified: dappAddressDto.verified,
        wallet: {
          publicKey: this.publicKey,
        },
      },
    };
  }

  async delete(command: DeleteAddressCommand): Promise<void> {
    await withErrorParsing(
      this.dataServiceWalletsApi.deleteDappAddress({
        id: command.addressId,
      }),
    );
  }

  async findAll(command: FindWalletDappAddressQuery): Promise<DappAddress[]> {
    const dappAddressDtos = await withErrorParsing(
      this.dataServiceWalletsApi.findAllDappAddresses(
        command.dappPublicKey.toBase58(),
      ),
    );
    return dappAddressDtos.map((it) => this.toDappAddress(it));
  }
}
