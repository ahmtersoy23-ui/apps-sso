import type { AdminApplication } from '../../types';

interface AppListProps {
  applications: AdminApplication[];
}

export default function AppList({ applications }: AppListProps) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Application Management</h2>
        <p className="text-purple-300 mt-1">View and manage applications in the SSO portal</p>
      </div>

      {/* Applications table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Application</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Code</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">URL</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Users</th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-purple-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.app_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <div>
                    <div className="text-white font-medium">{app.app_name}</div>
                    <div className="text-purple-400 text-sm">{app.app_description}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-purple-300 text-xs font-mono">
                    {app.app_code}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <a
                    href={app.app_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    {app.app_url}
                  </a>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-white font-medium">{app.user_count}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    app.is_active
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    <span className={`h-2 w-2 rounded-full mr-2 ${app.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {app.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {applications.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No applications found</h3>
          <p className="text-purple-300">No applications are registered in the system</p>
        </div>
      )}
    </div>
  );
}
