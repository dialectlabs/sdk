import { AddressTypeDto } from '@data-service-api/data-service-dapps-api';
import { IllegalArgumentError } from '@sdk/errors';
import type { AddressTypeV0 } from '@data-service-api/data-service-wallets-api.v0';
import type { Wallet } from '@wallet/wallet.interface';

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

export function toAddressTypeDto(type: AddressType): AddressTypeDto {
  switch (type) {
    case AddressType.Email:
      return AddressTypeDto.Email;
    case AddressType.PhoneNumber:
      return AddressTypeDto.Sms;
    case AddressType.Telegram:
      return AddressTypeDto.Telegram;
    case AddressType.Wallet:
      return AddressTypeDto.Wallet;
  }
  throw new IllegalArgumentError(`Unknown address type ${type}`);
}

export function toAddressType(
  addressTypeDto: AddressTypeDto | AddressTypeV0,
): AddressType {
  if (addressTypeDto === 'email' || addressTypeDto === AddressTypeDto.Email) {
    return AddressType.Email;
  }
  if (addressTypeDto === 'wallet' || addressTypeDto === AddressTypeDto.Wallet) {
    return AddressType.Wallet;
  }
  if (addressTypeDto === 'sms' || addressTypeDto === AddressTypeDto.Sms) {
    return AddressType.PhoneNumber;
  }
  if (
    addressTypeDto === 'telegram' ||
    addressTypeDto === AddressTypeDto.Telegram
  ) {
    return AddressType.Telegram;
  }
  throw new IllegalArgumentError(`Unknown address type ${addressTypeDto}`);
}

export interface DappAddress {
  id: string;
  enabled: boolean;
  channelId?: string | null;
  address: Address;
}
