import { IdentityError } from '@dialectlabs/sdk';

export class SNSIdentityError extends IdentityError {
  static ignoreMatcher = ['Favourite domain not found']; // warning, not error

  constructor(msg?: string) {
    super(SNSIdentityError.name, 'SNS Identity Error', msg);
  }
}
