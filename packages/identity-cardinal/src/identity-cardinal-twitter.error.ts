import { IdentityError } from '@dialectlabs/sdk';

export class CardinalIdentityError extends IdentityError {
  static ignoreMatcher = ['Account does not exist']; // warning, not error

  constructor(msg?: string) {
    super(CardinalIdentityError.name, 'Cardinal Identity Error', msg);
  }
}
