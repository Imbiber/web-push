import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateVAPIDKeys } from '../utils/vapid';

export class ProjectService {
  async createProject(userId: string, name: string) {
    const vapidKeys = generateVAPIDKeys();

    const project = await prisma.project.create({
      data: {
        name,
        userId,
        vapidPublicKey: vapidKeys.publicKey,
        vapidPrivateKey: vapidKeys.privateKey,
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        vapidPublicKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return project;
  }

  async getProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        apiKey: true,
        vapidPublicKey: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            subscriptions: true,
            notifications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects;
  }

  async getProject(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        vapidPublicKey: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            subscriptions: true,
            notifications: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    return project;
  }

  async getProjectByApiKey(apiKey: string) {
    const project = await prisma.project.findUnique({
      where: { apiKey },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    return project;
  }

  async updateProject(userId: string, projectId: string, name: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { name },
      select: {
        id: true,
        name: true,
        apiKey: true,
        vapidPublicKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted successfully' };
  }

  async getPublicConfig(apiKey: string) {
    const project = await prisma.project.findUnique({
      where: { apiKey },
      select: {
        vapidPublicKey: true,
      },
    });

    if (!project) {
      throw new AppError(404, 'Project not found');
    }

    return { vapidPublicKey: project.vapidPublicKey };
  }
}

export default new ProjectService();
