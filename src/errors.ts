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
