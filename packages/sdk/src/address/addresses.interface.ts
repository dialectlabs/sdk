import { Err, Ok, Result } from 'ts-results';
import { AddressTypeDto } from '../dialect-cloud-api/data-service-dapps-api';
import { IllegalArgumentError } from '../sdk/errors';
import type { Wallet } from '../wallet/wallet.interface';

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

export function toAddressTypeDto(type: AddressType): Result<AddressTypeDto, IllegalArgumentError> {
  const addressTypeDto = addressTypeToAddressTypeDto[type];
  if (!addressTypeDto) {
    return Err(new IllegalArgumentError(`Unknown address type ${type}`));
  }
  return Ok(addressTypeDto);
}

const addressTypeDtoToAddressType: Record<AddressTypeDto, AddressType> = {
  [AddressTypeDto.Email]: AddressType.Email,
  [AddressTypeDto.PhoneNumber]: AddressType.PhoneNumber,
  [AddressTypeDto.Telegram]: AddressType.Telegram,
  [AddressTypeDto.Wallet]: AddressType.Wallet,
};

export function toAddressType(type: AddressTypeDto): Result<AddressType, IllegalArgumentError> {
  const addressType = addressTypeDtoToAddressType[type];
  if (!addressType) {
    return Err(new IllegalArgumentError(`Unknown address type ${type}`));
  }
  return Ok(addressType);
}

export interface DappAddress {
  id: string;
  enabled: boolean;
  channelId?: string | null;
  address: Address;
}
