import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Query("status") status?: string) {
    return this.projects.list(status);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.projects.get(id);
  }

  @Post()
  create(@Body() input: CreateProjectDto) {
    return this.projects.create(input);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() input: UpdateProjectDto) {
    return this.projects.update(id, input);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.projects.remove(id);
  }
}
