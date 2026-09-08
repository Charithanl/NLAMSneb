import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { DomainRecordsService } from "./domain-records.service";

@Module({ imports: [DatabaseModule], providers: [DomainRecordsService], exports: [DomainRecordsService] })
export class DomainRecordsModule {}
