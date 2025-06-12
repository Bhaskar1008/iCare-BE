import type { IUser } from '@/models/user.model';
import type { IAuthResponse } from '../interfaces/auth.interface';

export class AuthResponseDto implements IAuthResponse {
  user!: IUser;
  accessToken!: string;
  refreshToken!: string;

  constructor(user: IUser, accessToken: string, refreshToken: string) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}
