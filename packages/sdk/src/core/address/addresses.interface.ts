import { AddressTypeDto } from '../../internal/data-service-api/data-service-dapps-api';
import { IllegalArgumentError } from '../../sdk/errors';
import type { Wallet } from '../../wallet/wallet.interface';

export interface Address {
  id: string;
  type: AddressType;
  verified: boolean;
  value: string;
  wallet: Wallet;
}

export enum AddressType {
  Email = 'EMAIL',
  PhoneNumber = 'PHONE_NUMBER',
  Telegram = 'TELEGRAM',
  Wallet = 'WALLET',
}

const addressTypeToAddressTypeDto: Record<AddressType, AddressTypeDto> = {
  [AddressType.Email]: AddressTypeDto.Email,
  [AddressType.PhoneNumber]: AddressTypeDto.PhoneNumber,
  [AddressType.Telegram]: AddressTypeDto.Telegram,
  [AddressType.Wallet]: AddressTypeDto.Wallet,
};

export function toAddressTypeDto(type: AddressType): AddressTypeDto {
  const addressTypeDto = addressTypeToAddressTypeDto[type];
  if (!addressTypeDto) {
    throw new IllegalArgumentError(`Unknown address type ${type}`);
  }
  return addressTypeDto;
}

const addressTypeDtoToAddressType: Record<AddressTypeDto, AddressType> = {
  [AddressTypeDto.Email]: AddressType.Email,
  [AddressTypeDto.PhoneNumber]: AddressType.PhoneNumber,
  [AddressTypeDto.Telegram]: AddressType.Telegram,
  [AddressTypeDto.Wallet]: AddressType.Wallet,
};

export function toAddressType(type: AddressTypeDto): AddressType {
  const addressType = addressTypeDtoToAddressType[type];
  if (!addressType) {
    throw new IllegalArgumentError(`Unknown address type ${type}`);
  }
  return addressType;
}

export interface DappAddress {
  id: string;
  enabled: boolean;
  channelId?: string | null;
  address: Address;
}
