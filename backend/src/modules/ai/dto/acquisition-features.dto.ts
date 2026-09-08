import { IsInt, IsNumber, IsString, Max, Min } from "class-validator";

export class AcquisitionFeaturesDto {
  @IsNumber() @Min(0) land_required_hectares!: number;
  @IsInt() @Min(0) parcel_count!: number;
  @IsInt() @Min(0) land_owner_count!: number;
  @IsInt() @Min(0) affected_families!: number;
  @IsInt() @Min(0) displaced_families!: number;
  @IsInt() @Min(0) objections_count!: number;
  @IsInt() @Min(0) hearings_count!: number;
  @IsInt() @Min(0) court_case_count!: number;
  @IsNumber() @Min(0) compensation_assessed_inr!: number;
  @IsNumber() @Min(0) compensation_disbursed_inr!: number;
  @IsNumber() @Min(0) compensation_pending_inr!: number;
  @IsNumber() @Min(0) rr_assessed_inr!: number;
  @IsNumber() @Min(0) rr_disbursed_inr!: number;
  @IsNumber() @Min(0) @Max(1) land_record_digitization_rate!: number;
  @IsInt() @Min(0) estimated_duration_days!: number;
  @IsString() state_ut!: string;
  @IsString() district!: string;
  @IsString() project_type!: string;
  @IsString() applicable_act!: string;
  @IsString() current_stage!: string;
}
