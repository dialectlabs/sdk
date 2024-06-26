export enum SmartMessageStateDto {
  Created = 'CREATED',
  ReadyForExecution = 'READY_FOR_EXECUTION',
  Executing = 'EXECUTING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Canceled = 'CANCELED',
}

export enum ActionType {
  SignTransaction = 'SIGN_TRANSACTION',
  OpenLink = 'OPEN_LINK',
  Cancel = 'CANCEL', // cancel without a transaction, in other words a noop
}

export class SmartMessageButtonLayoutElementDto {
  type!: 'button';
  text!: string;
  action!: SmartMessageSpecActionDto;
}

export class SmartMessageLabelLayoutElementDto {
  type!: 'label';
  text!: string;
}

export class SmartMessageSpecOpenLinkActionDto {
  type!: ActionType.OpenLink;
  link!: string;
}

export class SmartMessageSpecSignTransactionActionDto {
  humanReadableId!: string;
  type!: ActionType.SignTransaction;
}

export class SmartMessageSpecCancelActionDto {
  humanReadableId!: string;
  type!: ActionType.Cancel;
}

export type SmartMessageSpecActionDto =
  | SmartMessageSpecOpenLinkActionDto
  | SmartMessageSpecSignTransactionActionDto
  | SmartMessageSpecCancelActionDto;

export type SmartMessageLayoutElementDto =
  | SmartMessageButtonLayoutElementDto
  | SmartMessageLabelLayoutElementDto;

export class SmartMessageLayoutDto {
  icon!: string | null;
  description!: string | null;
  header!: string | null;
  subheader!: string | null;
  elements!: SmartMessageLayoutElementDto[][];
}

export class SmartMessageContentDto {
  state!: SmartMessageStateDto;
  layout!: SmartMessageLayoutDto;
}

export class SmartMessagePreviewParamsDto {
  state!: SmartMessageStateDto;
}

export class SmartMessageSystemParamsDto {
  state!: SmartMessageStateDto;
  workflowStateHumanReadableId!: string;
  createdByWalletAddress!: string;
  principalWalletAddress!: string;
  updatedByWalletAddress!: string;
}

export class CreateSmartMessageTransactionCommandDto {
  account!: string;
  actionHumanReadableId!: string;
}

export class SmartMessageTransactionDto {
  transaction!: string;
  message?: string;
}

export class SubmitSmartMessageTransactionCommandDto {
  readonly transaction!: string;
  readonly actionHumanReadableId!: string;
}
