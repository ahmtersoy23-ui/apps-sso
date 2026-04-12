import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { authService } from '../services/auth';
import { useState } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true);
      setError('');

      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      const response = await apiService.googleLogin(credentialResponse.credential);

      if (response.success) {
        authService.setTokens(response.data.accessToken, response.data.refreshToken);
        authService.setUser(response.data.user);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-2xl w-full">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-12">
          {/* Logo and Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl mb-6 shadow-md transition-transform duration-300 overflow-hidden">
              <img
                src="/logo.jpg"
                alt="IWA Apps"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-5xl font-bold text-white mb-3">IWA Apps</h1>
            <p className="text-slate-300 text-xl mb-4">Single Sign-On Portal</p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-slate-700/30 backdrop-blur-sm rounded-full border border-slate-600/30">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-slate-300 font-medium">Secure Authentication</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 rounded-2xl p-5 animate-shake">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-base">Authentication Failed</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Section */}
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-slate-300 mb-6">Sign in to access your applications</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
                <p className="text-slate-300 text-lg">Authenticating...</p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_blue"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    width="380"
                  />
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mt-10 pt-8 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm font-medium text-center mb-6">What you get</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <svg className="w-10 h-10 text-slate-400 mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-slate-200 text-sm font-medium">All Applications</p>
                  <p className="text-slate-400 text-xs mt-1">Access all your tools</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <svg className="w-10 h-10 text-slate-400 mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-slate-200 text-sm font-medium">Single Sign-On</p>
                  <p className="text-slate-400 text-xs mt-1">One login for everything</p>
                </div>
                <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <svg className="w-10 h-10 text-slate-400 mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-slate-200 text-sm font-medium">Enterprise Security</p>
                  <p className="text-slate-400 text-xs mt-1">Protected and encrypted</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <p className="text-slate-400 text-xs text-center">
                By signing in, you agree to our{' '}
                <a href="#" className="text-slate-300 hover:text-white underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-slate-300 hover:text-white underline">
                  Privacy Policy
                </a>
              </p>
              <p className="text-slate-500 text-sm text-center mt-3">
                Authorized users only • Contact admin for access
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-base">
            Powered by IWA Apps SSO
          </p>
        </div>
      </div>
    </div>
  );
}
