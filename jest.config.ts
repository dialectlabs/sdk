import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@address(.*)$': '<rootDir>/src/address$1',
    '^@auth/internal(.*)$': '<rootDir>/src/internal/auth$1',
    '^@auth(.*)$': '<rootDir>/src/auth$1',
    '^@dapp/internal(.*)$': '<rootDir>/src/internal/dapp$1',
    '^@dapp(.*)$': '<rootDir>/src/dapp$1',
    '^@data-service-api(.*)$': '<rootDir>/src/internal/data-service-api$1',
    '^@encryption(.*)$': '<rootDir>/src/internal/encryption$1',
    '^@messaging/internal(.*)$': '<rootDir>/src/internal/messaging$1',
    '^@messaging(.*)$': '<rootDir>/src/messaging$1',
    '^@sdk/internal(.*)$': '<rootDir>/src/internal/sdk$1',
    '^@sdk(.*)$': '<rootDir>/src/sdk$1',
    '^@utils/internal(.*)$': '<rootDir>/src/internal/utils$1',
    '^@wallet/internal(.*)$': '<rootDir>/src/internal/wallet$1',
    '^@wallet(.*)$': '<rootDir>/src/wallet$1',
    '^@wallet-adapter/internal(.*)$': '<rootDir>/src/internal/wallet-adapter$1',
    '^@wallet-adapter(.*)$': '<rootDir>/src/wallet-adapter$1',
  },
  testTimeout: 60000,
  testRunner: 'jasmine2',
};
export default config;
