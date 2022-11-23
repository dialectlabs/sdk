import { IdentityError } from '@dialectlabs/sdk';

export class OnsolIdentityError extends IdentityError {
  static ignoreMatcher = ['Main domain not found']; // warning, not error

  constructor(msg?: string) {
    super(OnsolIdentityError.name, 'Onsol Identity Error', msg);
  }
}
