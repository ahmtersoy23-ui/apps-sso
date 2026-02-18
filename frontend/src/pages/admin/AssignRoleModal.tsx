import type { AdminUser, AdminApplication, Role } from '../../types';

interface AssignRoleModalProps {
  show: boolean;
  onClose: () => void;
  selectedUser: AdminUser | null;
  applications: AdminApplication[];
  roles: Role[];
  onSubmit: (appId: string, roleId: string) => Promise<void>;
}

export default function AssignRoleModal({
  show,
  onClose,
  selectedUser,
  applications,
  roles,
  onSubmit,
}: AssignRoleModalProps) {
  if (!show || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-white/10 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Assign Application</h3>
            <p className="text-purple-300 text-sm mt-1">Assign {selectedUser.name} to an application</p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const appId = formData.get('app_id') as string;
            const roleId = formData.get('role_id') as string;

            try {
              await onSubmit(appId, roleId);
            } catch {
              alert('Failed to assign app role');
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Application
            </label>
            <select
              name="app_id"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select an application</option>
              {applications.map((app) => (
                <option key={app.app_id} value={app.app_id} className="bg-slate-800">
                  {app.app_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2">
              Role
            </label>
            <select
              name="role_id"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id} className="bg-slate-800">
                  {role.role_name} - {role.role_description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
