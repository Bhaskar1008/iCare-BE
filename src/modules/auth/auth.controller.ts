import type { Request, Response } from 'express';

class AuthController {
  constructor() {}

  async register(_req: Request, _res: Response): Promise<void> {
    // Implementation will go here
  }

  async login(_req: Request, _res: Response): Promise<void> {
    // Implementation will go here
  }

  async refreshToken(_req: Request, _res: Response): Promise<void> {
    // Implementation will go here
  }
}

export default AuthController;
