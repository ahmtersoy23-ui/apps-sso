import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Bilesen child render hatasinda fallback gostermesi gerekiyor.
// React 19'da error caught console.error log'lari testleri kirletmesin.
function Boom(): React.ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>healthy child</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tekrar dene' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sayfayı yenile' })).toBeInTheDocument();
  });

  it('resets fallback when "Tekrar dene" is clicked and child no longer throws', () => {
    let shouldThrow = true;
    function MaybeBoom(): React.ReactElement {
      if (shouldThrow) throw new Error('boom');
      return <p>recovered</p>;
    }

    render(
      <ErrorBoundary>
        <MaybeBoom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Bir hata oluştu')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));

    expect(screen.getByText('recovered')).toBeInTheDocument();
  });
});
