import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import type { Application, AdminUser, AdminApplication, Role } from '../types';
import UserTable from './admin/UserTable';
import AppList from './admin/AppList';
import RolesView from './admin/RolesView';
import AddUserModal from './admin/AddUserModal';
import AssignRoleModal from './admin/AssignRoleModal';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'apps' | 'roles'>('users');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const user = authService.getUser();

  useEffect(() => {
    loadApps();
    loadUsers();
    loadApplications();
    loadRoles();
  }, []);

  const loadApps = async () => {
    try {
      const response = await apiService.getMyApps();
      if (response.success) {
        setApps(response.data);
      }
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getAdminUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch {
      // silently handled
    }
  };

  const loadApplications = async () => {
    try {
      const response = await apiService.getAdminApplications();
      if (response.success) {
        setApplications(response.data);
      }
    } catch {
      // silently handled
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiService.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch {
      // silently handled
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiService.toggleUserStatus(userId, !currentStatus);
      await loadUsers();
    } catch {
      alert('Failed to update user status');
    }
  };

  const removeAppAccess = async (userId: string, appId: string) => {
    if (!confirm('Are you sure you want to remove this app access?')) {
      return;
    }
    try {
      await apiService.removeAppAccess(userId, appId);
      await loadUsers();
    } catch {
      alert('Failed to remove app access');
    }
  };

  const handleAddUser = async (email: string, name: string) => {
    await apiService.createUser(email, name);
    setShowAddUserModal(false);
    await loadUsers();
  };

  const handleAssignRole = async (appId: string, roleId: string) => {
    if (!selectedUser) return;
    await apiService.assignAppRole(selectedUser.user_id, appId, roleId);
    await loadUsers();
    setShowAssignModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <UserTable
              filteredUsers={filteredUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              toggleUserStatus={toggleUserStatus}
              removeAppAccess={removeAppAccess}
              setSelectedUser={setSelectedUser}
              setShowAssignModal={setShowAssignModal}
              setShowAddUserModal={setShowAddUserModal}
            />
          )}
          {activeTab === 'apps' && <AppList applications={applications} />}
          {activeTab === 'roles' && <RolesView />}
        </div>
      </main>

      <AddUserModal
        show={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSubmit={handleAddUser}
      />

      <AssignRoleModal
        show={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedUser(null);
        }}
        selectedUser={selectedUser}
        applications={applications}
        roles={roles}
        onSubmit={handleAssignRole}
      />
    </div>
  );
}
