import { Controller, Module } from "@nestjs/common";
import { DomainRecordsModule } from "../domain-records/domain-records.module";
import { DomainRecordsController } from "../domain-records/domain-records.controller";
import { DomainRecordsService } from "../domain-records/domain-records.service";

@Controller("rehabilitation/families") class RehabilitationController extends DomainRecordsController { protected readonly table = "rr_families" as const; constructor(records: DomainRecordsService) { super(records); } }
@Module({ imports: [DomainRecordsModule], controllers: [RehabilitationController] }) export class RehabilitationModule {}
