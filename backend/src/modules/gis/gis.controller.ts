import { Controller, Get, Query } from "@nestjs/common";
import { GisService } from "./gis.service";

@Controller("gis")
export class GisController {
  constructor(private readonly gis: GisService) {}

  @Get("villages")
  listVillages(@Query("district") district?: string, @Query("limit") limit?: string) {
    return this.gis.listVillages(district, Number(limit ?? 100));
  }
}
