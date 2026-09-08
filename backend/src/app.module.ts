import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiModule } from "./modules/ai/ai.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DatabaseModule } from "./modules/database/database.module";
import { GisModule } from "./modules/gis/gis.module";
import { HealthModule } from "./modules/health/health.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { AcquisitionModule } from "./modules/acquisition/acquisition.module";
import { CompensationModule } from "./modules/compensation/compensation.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { RehabilitationModule } from "./modules/rehabilitation/rehabilitation.module";
import { ReportsModule } from "./modules/reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../.env"] }),
    HttpModule,
    DatabaseModule,
    HealthModule,
    AiModule,
    AuthModule,
    GisModule,
    ProjectsModule,
    AcquisitionModule,
    CompensationModule,
    DocumentsModule,
    RehabilitationModule,
    ReportsModule,
  ],
})
export class AppModule {}
