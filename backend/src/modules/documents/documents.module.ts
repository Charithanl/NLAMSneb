import { Controller, Module } from "@nestjs/common";
import { DomainRecordsModule } from "../domain-records/domain-records.module";
import { DomainRecordsController } from "../domain-records/domain-records.controller";
import { DomainRecordsService } from "../domain-records/domain-records.service";

@Controller("documents") class DocumentsController extends DomainRecordsController { protected readonly table = "documents" as const; constructor(records: DomainRecordsService) { super(records); } }
@Module({ imports: [DomainRecordsModule], controllers: [DocumentsController] }) export class DocumentsModule {}
