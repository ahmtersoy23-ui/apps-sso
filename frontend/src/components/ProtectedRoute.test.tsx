import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { authService } from '../services/auth';

vi.mock('../services/auth', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    isSsoAdmin: vi.fn(),
  },
}));

const mockedAuth = authService as unknown as {
  isAuthenticated: ReturnType<typeof vi.fn>;
  isSsoAdmin: ReturnType<typeof vi.fn>;
};

function renderWithRouter(initialPath: string, requireSsoAdmin = false) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<p>landing</p>} />
        <Route path="/dashboard" element={<p>dashboard</p>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireSsoAdmin={requireSsoAdmin}>
              <p>admin content</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockedAuth.isAuthenticated.mockReset();
    mockedAuth.isSsoAdmin.mockReset();
  });

  it('redirects to "/" when user is not authenticated', () => {
    mockedAuth.isAuthenticated.mockReturnValue(false);
    renderWithRouter('/admin');
    expect(screen.getByText('landing')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated and admin not required', () => {
    mockedAuth.isAuthenticated.mockReturnValue(true);
    renderWithRouter('/admin', false);
    expect(screen.getByText('admin content')).toBeInTheDocument();
  });

  it('redirects to /dashboard when admin required but user is not admin', () => {
    mockedAuth.isAuthenticated.mockReturnValue(true);
    mockedAuth.isSsoAdmin.mockReturnValue(false);
    renderWithRouter('/admin', true);
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('renders children when admin is required and user is admin', () => {
    mockedAuth.isAuthenticated.mockReturnValue(true);
    mockedAuth.isSsoAdmin.mockReturnValue(true);
    renderWithRouter('/admin', true);
    expect(screen.getByText('admin content')).toBeInTheDocument();
  });
});
