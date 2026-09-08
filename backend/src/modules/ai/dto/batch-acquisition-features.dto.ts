import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { AcquisitionFeaturesDto } from "./acquisition-features.dto";

export class BatchAcquisitionFeaturesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcquisitionFeaturesDto)
  records!: AcquisitionFeaturesDto[];
}
