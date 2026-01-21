import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { authService } from '../services/auth';
import type { Application, User } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = authService.getUser();
      setUser(userData);

      const response = await apiService.getMyApps();
      if (response.success) {
        setApps(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.logout();
      window.location.href = '/';
    }
  };

  const getRoleBadgeStyle = (roleCode?: string) => {
    switch (roleCode) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-white';
      case 'editor':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'viewer':
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const getAppIcon = (appCode: string) => {
    const icons: Record<string, string> = {
      'amzsellmetrics': '/icons/amazon.svg',
      'stockpulse': '/icons/stockpulse.svg',
      'pricelab': '/icons/pricelab.svg',
      'manumaestro': '/icons/manumaestro.svg',
      'swiftstock': '/icons/swiftstock.svg',
    };
    return icons[appCode.toLowerCase()] || null;
  };

  const openApp = (appUrl: string) => {
    window.open(appUrl, '_blank');
  };

  const isAdmin = user?.apps && Object.values(user.apps).some(role => role === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <p className="mt-4 text-white text-lg">Loading your workspace...</p>
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
            <div className="flex items-center gap-4" style={{ marginLeft: '10px' }}>
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30 overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="IWA Apps"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">IWA Apps</h1>
                <p className="text-xs text-purple-300">SSO Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg font-medium transition-all duration-200 shadow-lg shadow-purple-500/50"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Console
                </button>
              )}

              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full ring-2 ring-purple-500"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-500">
                      <span className="text-white font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                    <p className="text-[10px] text-purple-300 leading-tight">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-1.5 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-md transition-all duration-200"
                    title="Logout"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 lg:px-12 xl:px-20 py-6">
        {error && (
          <div className="mb-6 bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Your Applications</h2>
          <p className="text-sm text-purple-300">Access all your authorized applications from one place</p>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-full mb-4">
              <svg
                className="h-10 w-10 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No applications</h3>
            <p className="text-purple-300 mb-1">You don't have access to any applications yet.</p>
            <p className="text-purple-400 text-sm">Contact your administrator for access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center max-w-[1800px] mx-auto">
            {apps.map((app) => (
              <div
                key={app.app_id}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 w-full max-w-[300px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{backgroundImage: `linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153))`}}></div>

                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 p-4`}>
                      {getAppIcon(app.app_code) ? (
                        <img
                          src={getAppIcon(app.app_code)!}
                          alt={app.app_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-purple-600 text-3xl font-bold">
                          {app.app_name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {app.role_code && (
                    <div className="flex justify-center mb-4">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeStyle(
                          app.role_code
                        )} shadow-lg`}
                      >
                        {app.role_name}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-white mb-3 text-center group-hover:text-purple-300 transition-colors">
                    {app.app_name}
                  </h3>

                  <p className="text-sm text-purple-300 mb-6 text-center line-clamp-2 leading-relaxed flex-grow">
                    {app.app_description}
                  </p>

                  <button
                    onClick={() => openApp(app.app_url)}
                    className="w-full inline-flex justify-center items-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70"
                  >
                    Open Application
                    <svg
                      className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-purple-400 text-sm">
            Powered by IWA Apps SSO • Secure Single Sign-On Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
