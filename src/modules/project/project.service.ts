import type { IProject } from '@/models/project.model';
import { ProjectRepository } from './project.repository';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { ProjectQueryDto } from './dto/project-query.dto';
import type { IProjectService } from './interfaces/project.interface';
import { NotFoundException } from '@/common/exceptions/not-found.exception';

export class ProjectService implements IProjectService {
  private readonly projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  public async createProject(data: CreateProjectDto): Promise<IProject> {
    return this.projectRepository.createProject(data);
  }

  public async getProjects(query: ProjectQueryDto): Promise<{
    projects: IProject[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.projectRepository.findWithPagination(query);
  }

  public async getProjectById(id: string): Promise<IProject> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  public async updateProject(
    id: string,
    data: Partial<CreateProjectDto>,
  ): Promise<IProject> {
    const project = await this.projectRepository.findByIdAndUpdate(id, data);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  public async deleteProject(id: string): Promise<void> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectRepository.findByIdAndDelete(id);
  }
}
