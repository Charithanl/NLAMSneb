import { Controller, Module } from "@nestjs/common";
import { DomainRecordsModule } from "../domain-records/domain-records.module";
import { DomainRecordsController } from "../domain-records/domain-records.controller";
import { DomainRecordsService } from "../domain-records/domain-records.service";

@Controller("compensation/cases") class CompensationCasesController extends DomainRecordsController { protected readonly table = "compensation_cases" as const; constructor(records: DomainRecordsService) { super(records); } }
@Controller("compensation/payments") class CompensationPaymentsController extends DomainRecordsController { protected readonly table = "compensation_payments" as const; constructor(records: DomainRecordsService) { super(records); } }
@Module({ imports: [DomainRecordsModule], controllers: [CompensationCasesController, CompensationPaymentsController] }) export class CompensationModule {}
