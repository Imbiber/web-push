'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../lib/api';

interface Project {
  id: string;
  name: string;
  apiKey: string;
  vapidPublicKey: string;
  createdAt: string;
  _count: {
    subscriptions: number;
    notifications: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout, loadUser } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUser().then(() => {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        fetchProjects();
      }
    });
  }, [isAuthenticated, loadUser, router]);

  const fetchProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await apiClient.createProject(newProjectName);
      setNewProjectName('');
      setShowNewProject(false);
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                PushNotify
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Your Projects</h2>
            <button
              onClick={() => setShowNewProject(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              New Project
            </button>
          </div>

          {showNewProject && (
            <div className="mb-6 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label
                    htmlFor="project-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="My Awesome Project"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {project.name}
                  </h3>
                  <div className="mt-4 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        API Key
                      </p>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                          {project.apiKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(project.apiKey)}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-500">Subscriptions</p>
                        <p className="font-semibold">
                          {project._count.subscriptions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Notifications</p>
                        <p className="font-semibold">
                          {project._count.notifications}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && !showNewProject && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No projects yet. Create your first project to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
