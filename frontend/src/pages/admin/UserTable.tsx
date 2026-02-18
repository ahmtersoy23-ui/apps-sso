import type { AdminUser } from '../../types';

interface UserTableProps {
  filteredUsers: AdminUser[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleUserStatus: (userId: string, currentStatus: boolean) => void;
  removeAppAccess: (userId: string, appId: string) => void;
  setSelectedUser: (user: AdminUser) => void;
  setShowAssignModal: (show: boolean) => void;
  setShowAddUserModal: (show: boolean) => void;
}

export default function UserTable({
  filteredUsers,
  searchQuery,
  setSearchQuery,
  toggleUserStatus,
  removeAppAccess,
  setSelectedUser,
  setShowAssignModal,
  setShowAddUserModal,
}: UserTableProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-purple-300 mt-1">Manage user accounts and their application access</p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">User</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Status</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Applications</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Last Login</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    {u.profile_picture ? (
                      <img
                        src={u.profile_picture}
                        alt={u.name}
                        className="h-10 w-10 rounded-full ring-2 ring-purple-500/50"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-500/50">
                        <span className="text-white font-bold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-white font-medium">{u.name}</div>
                      <div className="text-purple-400 text-sm">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => toggleUserStatus(u.user_id, u.is_active)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      u.is_active
                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full mr-2 ${u.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-2">
                    {u.apps.length === 0 ? (
                      <span className="text-purple-400 text-sm">No apps assigned</span>
                    ) : (
                      u.apps.map((app) => (
                        <div
                          key={app.app_id}
                          className="inline-flex items-center bg-white/5 border border-white/10 rounded-lg px-2 py-1"
                        >
                          <span className="text-white text-xs font-medium">{app.app_name}</span>
                          <span className="mx-1 text-purple-400 text-xs">·</span>
                          <span className={`text-xs ${
                            app.role_code === 'admin' ? 'text-red-300' :
                            app.role_code === 'editor' ? 'text-blue-300' :
                            'text-gray-300'
                          }`}>
                            {app.role_name}
                          </span>
                          <button
                            onClick={() => removeAppAccess(u.user_id, app.app_id)}
                            className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setShowAssignModal(true);
                      }}
                      className="inline-flex items-center px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-xs transition-colors"
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Assign
                    </button>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-purple-300 text-sm">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => toggleUserStatus(u.user_id, u.is_active)}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
          <p className="text-purple-300">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}
