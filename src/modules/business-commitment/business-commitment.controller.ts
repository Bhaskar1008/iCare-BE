import type { Request, Response } from 'express';
import { BusinessCommitmentService } from './business-commitment.service';
import { CreateBusinessCommitmentDto } from './dto/create-business-commitment.dto';
import { UpdateBusinessCommitmentDto } from './dto/update-business-commitment.dto';
import { UpdateCommitmentCountDto } from './dto/update-commitment-count.dto';
import { FilterBusinessCommitmentDto } from './dto/filter-business-commitment.dto';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class BusinessCommitmentController {
  private readonly businessCommitmentService: BusinessCommitmentService;

  constructor() {
    this.businessCommitmentService = new BusinessCommitmentService();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const createDto = plainToClass(CreateBusinessCommitmentDto, {
        ...req.body,
        createdBy: req.body.agentId, // Set createdBy to agentId
      });
      await validateOrReject(createDto);

      const result = await this.businessCommitmentService.create(createDto);

      if (result.existingCommitment) {
        res.status(409).json({
          message: 'A commitment already exists for this date',
          existingCommitment: result.existingCommitment,
        });
        return;
      }

      res.status(201).json(result.commitment);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }

  async updateCommitmentCount(req: Request, res: Response): Promise<void> {
    try {
      const updateDto = plainToClass(UpdateCommitmentCountDto, req.body);
      await validateOrReject(updateDto);

      const result = await this.businessCommitmentService.updateCommitmentCount(
        req.params.id,
        updateDto.additionalCount,
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const updateDto = plainToClass(UpdateBusinessCommitmentDto, req.body);
      await validateOrReject(updateDto);

      const result = await this.businessCommitmentService.update(
        req.params.id,
        updateDto,
      );
      res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }

  async filter(req: Request, res: Response): Promise<void> {
    try {
      const filterDto = plainToClass(FilterBusinessCommitmentDto, req.query);
      await validateOrReject(filterDto);

      const result = await this.businessCommitmentService.filter(filterDto);
      res.status(200).json(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      res.status(400).json({ message });
    }
  }
}
