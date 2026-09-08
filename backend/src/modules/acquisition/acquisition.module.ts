import { Controller, Module } from "@nestjs/common";
import { DomainRecordsModule } from "../domain-records/domain-records.module";
import { DomainRecordsController } from "../domain-records/domain-records.controller";
import { DomainRecordsService } from "../domain-records/domain-records.service";

@Controller("acquisition/cases")
class AcquisitionController extends DomainRecordsController { protected readonly table = "acquisition_cases" as const; constructor(records: DomainRecordsService) { super(records); } }
@Module({ imports: [DomainRecordsModule], controllers: [AcquisitionController] }) export class AcquisitionModule {}
