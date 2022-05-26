import { EmbeddedWallet } from '../src/wallet';
import {
  DataServiceApi,
  DialectsApi,
} from '../src/data-service-api/data-service-api';
import { TokenProvider } from '../src/data-service-api/token-provider';

describe('Data service api (e2e)', () => {
  const baseUrl = 'http://localhost:8080';

  describe('Dialects', () => {
    let api: DialectsApi;

    beforeEach(() => {
      const wallet = EmbeddedWallet.create();
      const tokenProvider = TokenProvider.create(wallet);
      api = DataServiceApi.create(baseUrl, tokenProvider).dialects;
    });

    test('can list all dialects', async () => {
      // when
      const dialects = await api.list();
      // then
      expect(dialects).toMatchObject([]);
    });
    //
    // test('can create dialect', async () => {
    //   // given
    //   const before = await api.list();
    //   expect(before).toMatchObject([]);
    //   // when
    //   api.create({
    //     members: [
    //
    //     ],
    //   });
    //   expect(isParsedTokenValid).toBeTruthy();
    //
    //   api.create();
    //   const wallet: EmbeddedWallet = EmbeddedWallet.create();
    //   // given
    //   const token = await Token.generate(
    //     wallet,
    //     Duration.fromObject({ seconds: 100 }),
    //   );
    //   // when
    //   const isValid = Token.isValid(token);
    //   expect(isValid).toBeTruthy();
    //   const parsedToken = Token.parse(token.rawValue);
    //   const isParsedTokenValid = Token.isValid(parsedToken);
    //   expect(isParsedTokenValid).toBeTruthy();
    // });
  });
});
