import type { IRegisterUserDto } from '../interfaces/auth.interface';

export class RegisterDto implements IRegisterUserDto {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  role?: string;
  projectId?: string;
}
