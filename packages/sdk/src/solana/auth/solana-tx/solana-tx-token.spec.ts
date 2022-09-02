import { DialectWalletAdapterWrapper } from '../../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { NodeDialectWalletAdapter } from '../../../wallet-adapter/node-dialect-wallet-adapter';
import {
  DialectWalletAdapterSolanaTxTokenSigner,
  SolanaTxTokenSigner,
} from './solana-tx-token-signer';
import { Duration } from 'luxon';
import type { AuthenticationFacade } from '../../../core/auth/authentication-facade';
import { SolanaTxAuthenticationFacadeFactory } from './solana-tx-authentication-facade-factory';

describe('solana-tx token tests', () => {
  let wallet: DialectWalletAdapterWrapper;
  let signer: SolanaTxTokenSigner;
  let authenticationFacade: AuthenticationFacade;
  beforeEach(() => {
    wallet = new DialectWalletAdapterWrapper(NodeDialectWalletAdapter.create());
    signer = new DialectWalletAdapterSolanaTxTokenSigner(wallet);
    authenticationFacade = new SolanaTxAuthenticationFacadeFactory(
      signer,
    ).get();
  });

  test('when not expired validation returns true', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: 100 }),
    );
    // then
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeTruthy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeTruthy();
  });

  test('when expired validation returns false', async () => {
    // when
    const token = await authenticationFacade.generateToken(
      Duration.fromObject({ seconds: -100 }),
    );
    // then
    const isValid = authenticationFacade.isValid(token);
    expect(isValid).toBeFalsy();
    const parsedToken = authenticationFacade.parseToken(token.rawValue);
    const isParsedTokenValid = authenticationFacade.isValid(parsedToken);
    expect(isParsedTokenValid).toBeFalsy();
  });
});
