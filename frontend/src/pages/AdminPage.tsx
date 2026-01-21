import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import type { Application } from '../types';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'apps' | 'roles'>('users');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getUser();

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const response = await apiService.getMyApps();
      if (response.success) {
        setApps(response.data);
      }
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = apps.some(app => app.role_code === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <p className="mt-4 text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-4">
            <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-purple-300 mb-6">You don't have permission to access the admin console.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="px-6 lg:px-12 xl:px-20 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="h-12 w-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors border border-white/20"
              >
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Console</h1>
                <p className="text-sm text-purple-300">Manage users, applications, and permissions</p>
              </div>
            </div>

            {user && (
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-10 w-10 rounded-full ring-2 ring-purple-500"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-500">
                    <span className="text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-purple-300">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-12 xl:px-20 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-purple-300 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Users
                </div>
              </button>
              <button
                onClick={() => setActiveTab('apps')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'apps'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-purple-300 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Applications
                </div>
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'roles'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-purple-300 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Roles & Permissions
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">User Management</h2>
                  <p className="text-purple-300 mt-1">Manage user accounts and their application access</p>
                </div>
                <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add User
                </button>
              </div>

              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                  <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
                <p className="text-purple-300">User management interface is under development</p>
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Application Management</h2>
                  <p className="text-purple-300 mt-1">Add, edit, or remove applications from the SSO portal</p>
                </div>
                <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Application
                </button>
              </div>

              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
                  <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
                <p className="text-purple-300">Application management interface is under development</p>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Roles & Permissions</h2>
                  <p className="text-purple-300 mt-1">Configure user roles and access permissions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-red-500/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-white">👑</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Administrator</h3>
                  <p className="text-red-200 text-sm mb-4">Full access to all features and user management</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-red-200">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Full read/write access
                    </div>
                    <div className="flex items-center text-sm text-red-200">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      User management
                    </div>
                    <div className="flex items-center text-sm text-red-200">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      System configuration
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-white">✏️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Editor</h3>
                  <p className="text-blue-200 text-sm mb-4">Can view and edit data within applications</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-blue-200">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Read access
                    </div>
                    <div className="flex items-center text-sm text-blue-200">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Write access
                    </div>
                    <div className="flex items-center text-sm text-blue-200">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Data modification
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-sm rounded-xl border border-gray-500/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <span className="text-2xl font-bold text-white">👁️</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Viewer</h3>
                  <p className="text-gray-300 text-sm mb-4">Read-only access to application data</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-300">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Read-only access
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      View reports
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Export data
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
