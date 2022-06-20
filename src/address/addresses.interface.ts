import type { PublicKey } from '@solana/web3.js';
import { AddressTypeDto } from '@data-service-api/data-service-dapps-api';
import { IllegalArgumentError } from '@sdk/errors';
import type { AddressTypeV0 } from '@data-service-api/data-service-wallets-api';

export interface Address {
  id: string;
  type: AddressType;
  verified: boolean;
  value: string;
  wallet: Wallet;
}

export interface Wallet {
  publicKey: PublicKey;
}

export enum AddressType {
  Email = 'EMAIL',
  PhoneNumber = 'PHONE_NUMBER',
  Telegram = 'TELEGRAM',
  Wallet = 'WALLET',
}

export interface DappAddress {
  id: string;
  enabled: boolean;
  telegramChatId?: string | null;
  address: Address;
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