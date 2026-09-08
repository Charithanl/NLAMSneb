import { Body, Controller, Get, Post } from "@nestjs/common";
import { AcquisitionFeaturesDto } from "./dto/acquisition-features.dto";
import { BatchAcquisitionFeaturesDto } from "./dto/batch-acquisition-features.dto";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get("model-info")
  getModelInfo() {
    return this.ai.modelInfo();
  }

  @Post("predict-delay")
  predictDelay(@Body() features: AcquisitionFeaturesDto) {
    return this.ai.predictDelay(features);
  }

  @Post("predict-delay/batch")
  predictDelayBatch(@Body() input: BatchAcquisitionFeaturesDto) {
    return this.ai.predictDelayBatch(input);
  }

  @Post("readiness-score")
  readinessScore(@Body() features: AcquisitionFeaturesDto) {
    return this.ai.readinessScore(features);
  }
}
