import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { DomainRecordsService, DomainTable } from "./domain-records.service";

export abstract class DomainRecordsController {
  protected abstract readonly table: DomainTable;
  constructor(protected readonly records: DomainRecordsService) {}

  @Get() list(@Query() query: Record<string, string | undefined>) { return this.records.list(this.table, query); }
  @Get(":id") get(@Param("id") id: string) { return this.records.get(this.table, id); }
  @Post() create(@Body() payload: Record<string, unknown>) { return this.records.upsert(this.table, payload); }
  @Patch(":id") update(@Param("id") id: string, @Body() payload: Record<string, unknown>) { return this.records.upsert(this.table, { ...payload, id }); }
  @Delete(":id") remove(@Param("id") id: string) { return this.records.remove(this.table, id); }
}
