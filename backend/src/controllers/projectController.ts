import { Request, Response, NextFunction } from 'express';
import projectService from '../services/projectService';
import { createProjectSchema, updateProjectSchema } from '../utils/validation';
import { AuthRequest } from '../types';

export class ProjectController {
  async createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name } = createProjectSchema.parse(req.body);

      const project = await projectService.createProject(req.user.id, name);

      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const projects = await projectService.getProjects(req.user.id);

      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }

  async getProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const project = await projectService.getProject(req.user.id, req.params.id);

      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name } = updateProjectSchema.parse(req.body);

      const project = await projectService.updateProject(req.user.id, req.params.id, name);

      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await projectService.deleteProject(req.user.id, req.params.id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPublicConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await projectService.getPublicConfig(req.params.apiKey);

      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProjectController();
