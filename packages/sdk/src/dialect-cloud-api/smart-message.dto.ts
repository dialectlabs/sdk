import type { SmartMessageContentDto } from './smart-message-spec.dto';

export class SmartMessageDto {
  id!: string;
  content!: SmartMessageContentDto;
}
