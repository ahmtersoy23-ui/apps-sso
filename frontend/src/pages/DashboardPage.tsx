import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { authService } from '../services/auth';
import { getRoleBadgeStyle, getAppIcon, getAppDisplayName, isValidAppUrl } from '../utils/dashboard-helpers';
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

      // Refresh token on load to pick up any permission changes since last login
      try {
        const refreshResponse = await apiService.refreshAccessToken();
        if (refreshResponse.success) {
          authService.setTokens(refreshResponse.data.accessToken, refreshResponse.data.refreshToken);
        }
      } catch {
        // Continue with existing token if refresh fails
      }

      const userData = authService.getUser();
      setUser(userData);

      const response = await apiService.getMyApps();
      if (response.success) {
        setApps(response.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch {
      // logout failed silently
    } finally {
      authService.logout();
      window.location.href = '/';
    }
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const navigateToApp = (url: string) => {
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  const openApp = async (appCode: string, appUrl: string) => {
    // Validate URL before opening
    if (!isValidAppUrl(appUrl)) {
      // blocked: untrusted URL
      return;
    }

    // Fire-and-forget: log which app user clicked
    apiService.logAppOpen(appCode, appUrl);

    try {
      const refreshResponse = await apiService.refreshAccessToken();

      if (refreshResponse.success) {
        const { accessToken, refreshToken } = refreshResponse.data;
        authService.setTokens(accessToken, refreshToken);

        const url = new URL(appUrl);
        url.searchParams.set('token', accessToken);
        navigateToApp(url.toString());
      } else {
        const accessToken = authService.getAccessToken();
        if (accessToken) {
          const url = new URL(appUrl);
          url.searchParams.set('token', accessToken);
          navigateToApp(url.toString());
        }
      }
    } catch {
      // token refresh failed, use existing token
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        const url = new URL(appUrl);
        url.searchParams.set('token', accessToken);
        navigateToApp(url.toString());
      }
    }
  };

  // Check if user has admin role in any app
  const isAdmin = apps.some(app => app.role_code === 'admin');

  // Render application card (kare, buyuk)
  const renderAppCard = (app: Application) => (
    <div
      key={app.app_id}
      onClick={() => openApp(app.app_code, app.app_url)}
      className="group relative bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-indigo-950/30 w-full aspect-square flex flex-col cursor-pointer"
    >
      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="p-5 h-full flex flex-col justify-center">
        <div className="flex flex-col items-center flex-1 justify-center">
          <div className="flex items-center justify-center" style={{ marginBottom: '1.5rem' }}>
            <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 p-4">
              {getAppIcon(app.app_code) ? (
                <img
                  src={getAppIcon(app.app_code)!}
                  alt={app.app_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-indigo-600 text-3xl font-bold">
                  {app.app_name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {app.role_code && (
            <div className="flex justify-center" style={{ marginBottom: '1rem' }}>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeStyle(
                  app.role_code
                )}`}
              >
                {app.role_name}
              </span>
            </div>
          )}

          <h3 className="text-lg font-bold text-white mb-3 text-center group-hover:text-indigo-300 transition-colors">
            {getAppDisplayName(app.app_name, app.app_code)}
          </h3>

          <p className="text-sm text-slate-400 text-center leading-relaxed min-h-[2.5rem]">
            {app.app_description}
          </p>
        </div>

        <button
          onClick={() => openApp(app.app_code, app.app_url)}
          className="w-full inline-flex justify-center items-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl font-semibold transition-all duration-200"
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
  );

  // Render tool card (yatay, kompakt)
  const renderToolCard = (app: Application) => (
    <div
      key={app.app_id}
      onClick={() => openApp(app.app_code, app.app_url)}
      className="group relative bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden hover:shadow-md hover:shadow-indigo-950/20 cursor-pointer"
    >
      <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative p-4 flex items-center gap-4">
        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 p-2">
          {getAppIcon(app.app_code) ? (
            <img
              src={getAppIcon(app.app_code)!}
              alt={app.app_name}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-indigo-600 text-lg font-bold">
              {app.app_name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
            {getAppDisplayName(app.app_name, app.app_code)}
          </h3>
          <p className="text-xs text-slate-400 truncate">
            {app.app_description}
          </p>
        </div>

        <svg
          className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 shrink-0 transform group-hover:translate-x-0.5 transition-all"
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
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="mt-4 text-white text-lg">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="px-6 lg:px-12 xl:px-20 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4" style={{ marginLeft: '10px' }}>
              <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="IWA Apps"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">IWA Apps</h1>
                <p className="text-xs text-slate-400">SSO Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg font-medium transition-all duration-200"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Console
                </button>
              )}

              {user && (
                <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700/50">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full ring-2 ring-slate-600"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center ring-2 ring-slate-600">
                      <span className="text-white font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
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
      <main className="px-6 lg:px-12 xl:px-20 py-6 flex flex-col items-center justify-center flex-1">
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

        {apps.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700/50 w-full max-w-[1600px]">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-700/50 rounded-full mb-4">
              <svg
                className="h-10 w-10 text-slate-400"
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
            <h3 className="text-xl font-semibold text-white mb-2">No applications or tools</h3>
            <p className="text-slate-300 mb-1">You don't have access to any applications yet.</p>
            <p className="text-slate-400 text-sm">Contact your administrator for access.</p>
          </div>
        ) : (
          <>
            {/* Applications Section */}
            {apps.filter(app => app.app_type !== 'tool').length > 0 && (
              <div className="w-full max-w-[1800px] mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">Your Applications</h2>
                  <p className="text-sm text-slate-400">Full-featured business applications</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {apps.filter(app => app.app_type !== 'tool').map((app) => renderAppCard(app))}
                </div>
              </div>
            )}

            {/* Tools Section */}
            {apps.filter(app => app.app_type === 'tool').length > 0 && (
              <div className="w-full max-w-[1800px]">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white mb-1">Your Tools</h2>
                  <p className="text-sm text-slate-400">Quick utilities and helpers</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {apps.filter(app => app.app_type === 'tool').map((app) => renderToolCard(app))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            Powered by IWA Apps SSO • Secure Single Sign-On Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
