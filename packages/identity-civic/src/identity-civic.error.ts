import { IdentityError } from '@dialectlabs/sdk';

export class CivicIdentityError extends IdentityError {
  static ignoreMatcher = ['Unsupported storage location']; // warning, not error

  constructor(msg?: string) {
    super(CivicIdentityError.name, 'Civic Identity Error', msg);
  }
}
