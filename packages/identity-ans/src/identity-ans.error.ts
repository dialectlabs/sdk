import { IdentityError } from '@dialectlabs/sdk';

export class ANSIdentityError extends IdentityError {
  static ignoreMatcher = ['Main domain not found']; // warning, not error

  constructor(msg?: string) {
    super(ANSIdentityError.name, 'Onsol Identity Error', msg);
  }
}
