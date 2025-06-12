import type { ILoginDto } from '../interfaces/auth.interface';

export class LoginDto implements ILoginDto {
  email!: string;
  password!: string;
}
