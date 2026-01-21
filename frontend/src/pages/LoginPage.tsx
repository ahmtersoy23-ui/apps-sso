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
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">IWA Apps</h2>
          <p className="mt-2 text-sm text-gray-600">
            Single Sign-On Portal
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-600">Sign in with your Google account</p>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            )}
          </div>

          <div className="text-xs text-center text-gray-500 mt-8">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            <p>Authorized users only</p>
            <p className="mt-1">Contact admin if you need access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
