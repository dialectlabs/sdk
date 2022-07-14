import type { Wallet } from '@wallet/wallet.interface';

export type DappNotificationCode = 'announcements' | string;

export interface DappNotification {
  id: string;
  code: DappNotificationCode;
  name: string;
  trigger: string;
}

export interface DappNotificationConfig {
  dappNotification: DappNotification;
  config: NotificationConfig;
}

export interface WalletDappNotificationConfig {
  wallet: Wallet;
  notification: DappNotification;
  config: NotificationConfig;
}

export interface NotificationConfig {
  enabled: boolean;
}
