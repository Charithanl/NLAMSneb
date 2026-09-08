import { Controller, Get, Module } from "@nestjs/common";
import { DomainRecordsModule } from "../domain-records/domain-records.module";
import { DomainRecordsController } from "../domain-records/domain-records.controller";
import { DomainRecordsService } from "../domain-records/domain-records.service";

@Controller("reports") class ReportsController extends DomainRecordsController {
  protected readonly table = "reports" as const;
  constructor(records: DomainRecordsService) { super(records); }
  @Get("metrics") async metrics() { return { projectsInMotion: 0, verifiedParcels: 0, paymentsQueued: 0, openGrievances: 0 }; }
}
@Module({ imports: [DomainRecordsModule], controllers: [ReportsController] }) export class ReportsModule {}
