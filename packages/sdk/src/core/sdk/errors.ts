export class DialectSdkError extends Error {
  constructor(
    readonly type: string,
    readonly title: string,
    readonly msg?: string,
    readonly details?: any[],
  ) {
    super(msg);
    this.msg = msg;
    this.type = type;
    this.title = title;
    this.details = details;
  }
}

export class IllegalArgumentError extends DialectSdkError {
  constructor(title: string, msg?: string, details?: any) {
    super(IllegalArgumentError.name, title, msg, details);
  }
}

export class IllegalStateError extends DialectSdkError {
  constructor(title: string, msg?: string, details?: any) {
    super(IllegalStateError.name, title, msg, details);
  }
}

export class UnsupportedOperationError extends DialectSdkError {
  constructor(title: string, msg?: string, details?: any) {
    super(UnsupportedOperationError.name, title, msg, details);
  }
}

export class UnknownError extends DialectSdkError {
  constructor(details?: any, msg?: string) {
    super(
      UnknownError.name,
      'Error',
      msg ?? 'Something went wrong. Please try again later.',
      details,
    );
  }
}

export class BusinessConstraintViolationError extends DialectSdkError {
  constructor(msg?: string) {
    super(BusinessConstraintViolationError.name, 'Error', msg);
  }
}

export class ResourceAlreadyExistsError extends DialectSdkError {
  constructor(msg?: string) {
    super(ResourceAlreadyExistsError.name, 'Error', msg);
  }
}

export class AuthenticationError extends DialectSdkError {
  constructor(msg?: string) {
    super(AuthenticationError.name, 'Error', msg);
  }
}

export class AuthorizationError extends DialectSdkError {
  constructor(msg?: string) {
    super(AuthorizationError.name, 'Error', msg);
  }
}

export class ResourceNotFoundError extends DialectSdkError {
  constructor(msg?: string) {
    super(ResourceNotFoundError.name, 'Error', msg);
  }
}

export abstract class IdentityError extends DialectSdkError {}
