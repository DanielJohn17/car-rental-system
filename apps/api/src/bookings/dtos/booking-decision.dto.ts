import { IsOptional, IsString } from 'class-validator';

export class BookingDecisionDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
