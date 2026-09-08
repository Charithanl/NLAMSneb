import { IsDateString, IsIn, IsInt, IsNumber, IsString, Max, Min } from "class-validator";

const projectStatuses = ["planning", "survey", "acquisition", "award", "possession"] as const;

export class CreateProjectDto {
  @IsString() id!: string;
  @IsString() code!: string;
  @IsString() name!: string;
  @IsString() state!: string;
  @IsString() district!: string;
  @IsString() agency!: string;
  @IsIn(projectStatuses) status!: (typeof projectStatuses)[number];
  @IsInt() @Min(0) @Max(100) progress!: number;
  @IsInt() @Min(0) @Max(100) riskScore!: number;
  @IsNumber() @Min(0) budgetCrore!: number;
  @IsInt() @Min(0) parcels!: number;
  @IsInt() @Min(0) affectedFamilies!: number;
  @IsDateString() startDate!: string;
  @IsDateString() targetDate!: string;
  @IsString() description!: string;
}
