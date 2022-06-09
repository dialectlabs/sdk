import { UnsupportedOperationError } from '@sdk/errors';

export function requireSingleMember<T>(members: T[]) {
  if (members.length !== 1) {
    throw new UnsupportedOperationError(
      `Unsupported operation', 'Only P2P threads are supported: expected 2 members, but got ${members.length}`,
    );
  }
  return members[0]!;
}
