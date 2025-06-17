import type { IUser } from '@/models/user.model';
import type { IAuthResponse } from '../interfaces/auth.interface';
import type { IProject } from '@/models/project.model';

export class AuthResponseDto implements IAuthResponse {
  user!: IUser;
  accessToken!: string;
  refreshToken!: string;
  projects?: IProject[];

  constructor(
    user: IUser,
    accessToken: string,
    refreshToken: string,
    projects?: IProject[],
  ) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.projects = projects;
  }
}
