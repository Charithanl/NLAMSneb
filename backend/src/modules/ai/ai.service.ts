import { HttpService } from "@nestjs/axios";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { AcquisitionFeaturesDto } from "./dto/acquisition-features.dto";
import { BatchAcquisitionFeaturesDto } from "./dto/batch-acquisition-features.dto";

@Injectable()
export class AiService {
  private readonly aiUrl: string;

  constructor(private readonly http: HttpService, config: ConfigService) {
    this.aiUrl = config.get<string>("AI_SERVICE_URL", "http://127.0.0.1:8001").replace(/\/$/, "");
  }

  async predictDelay(features: AcquisitionFeaturesDto) {
    try {
      const response = await firstValueFrom(this.http.post(`${this.aiUrl}/predict-delay`, features));
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException("The AI prediction service is unavailable.");
    }
  }

  async readinessScore(features: AcquisitionFeaturesDto) {
    try {
      const response = await firstValueFrom(this.http.post(`${this.aiUrl}/readiness-score`, features));
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException("The AI prediction service is unavailable.");
    }
  }

  async predictDelayBatch(input: BatchAcquisitionFeaturesDto) {
    try {
      const response = await firstValueFrom(this.http.post(`${this.aiUrl}/predict-delay/batch`, input));
      return response.data;
    } catch {
      throw new ServiceUnavailableException("The AI prediction service is unavailable.");
    }
  }

  async modelInfo() {
    try {
      const response = await firstValueFrom(this.http.get(`${this.aiUrl}/model-info`));
      return response.data;
    } catch (error) {
      throw new ServiceUnavailableException("The AI prediction service is unavailable.");
    }
  }
}
