import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { SystemSecret, RotateSecretResponse } from '../../types';

const SECRET_LABELS: Record<string, string> = {
  JWT_SECRET: 'JWT Access Token Secret',
  JWT_REFRESH_SECRET: 'JWT Refresh Token Secret',
};

const SECRET_DESCRIPTIONS: Record<string, string> = {
  JWT_SECRET: 'Access token signing key (1h expiry). Rotation invalidates all active sessions.',
  JWT_REFRESH_SECRET: 'Refresh token signing key (7d expiry). Rotation invalidates all refresh tokens.',
};

interface RotateResult {
  secretKey: string;
  newValue: string;
  version: number;
  affectedApps: string[];
  warning: string;
}

export default function SecretsView() {
  const [secrets, setSecrets] = useState<SystemSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [revertKey, setRevertKey] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rotateResult, setRotateResult] = useState<RotateResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSecrets();
  }, []);

  const loadSecrets = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSecrets();
      if (response.success) setSecrets(response.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async (key: string) => {
    setProcessing(true);
    try {
      const response = await apiService.rotateSecret(key);
      if (response.success) {
        const result: RotateSecretResponse = response.data;
        setRotateResult({
          secretKey: key,
          newValue: result.new_value,
          version: result.version,
          affectedApps: result.affected_apps,
          warning: result.warning,
        });
        await loadSecrets();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rotation failed');
    } finally {
      setProcessing(false);
      setConfirmKey(null);
    }
  };

  const handleRevert = async (key: string) => {
    setProcessing(true);
    try {
      const response = await apiService.revertSecret(key);
      if (response.success) {
        await loadSecrets();
        setRevertKey(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Revert failed');
    } finally {
      setProcessing(false);
      setRevertKey(null);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" aria-hidden="true"></div>
        <span className="ml-3 text-purple-300">Loading secrets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Secret Yönetimi</h2>
        <p className="text-sm text-purple-300 mt-1">JWT secret'larını web arayüzünden rotate edin. Rotation sonrası tüm aktif oturumlar geçersiz sayılır.</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
        <svg className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="text-sm text-amber-200">
          <p className="font-semibold mb-1">Rotate sonrası diğer uygulamalar güncellenmeli</p>
          <p>JWT_SECRET ve JWT_REFRESH_SECRET rotate edildiğinde, diğer uygulamaların (PriceLab, AmzSellMetrics, StockPulse, SwiftStock, ManuMaestro) sunucusundaki <code className="bg-white/10 px-1 rounded">.env</code> dosyalarını yeni değerle güncellemeniz ve <code className="bg-white/10 px-1 rounded">pm2 restart</code> yapmanız gerekir.</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
          <span className="text-red-300 text-sm">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error message"
            className="text-red-400 hover:text-red-200"
          >
            <svg aria-hidden="true" focusable="false" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Secrets Table */}
      <div className="space-y-4">
        {secrets.map((secret) => (
          <div key={secret.id} className="bg-white/5 rounded-xl border border-white/10 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-white font-semibold">{SECRET_LABELS[secret.secret_key] || secret.secret_key}</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                    v{secret.version}
                  </span>
                </div>
                <p className="text-sm text-purple-300 mb-3">{SECRET_DESCRIPTIONS[secret.secret_key] || ''}</p>
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <span className="font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">{secret.secret_key}</span>
                  {secret.rotated_at ? (
                    <span>
                      Son rotate: <span className="text-slate-300">{new Date(secret.rotated_at).toLocaleString('tr-TR')}</span>
                      {secret.rotated_by_name && (
                        <span className="text-slate-400"> — {secret.rotated_by_name}</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-500">Hiç rotate edilmedi (env değeri aktif)</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-6">
                {secret.has_previous && (
                  <button
                    onClick={() => setRevertKey(secret.secret_key)}
                    className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg border border-slate-600 transition-colors"
                  >
                    Geri Al
                  </button>
                )}
                <button
                  onClick={() => setConfirmKey(secret.secret_key)}
                  className="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
                >
                  Rotate
                </button>
              </div>
            </div>
          </div>
        ))}

        {secrets.length === 0 && !loading && (
          <div className="text-center py-8 text-purple-300">
            <p>Secret tablosu bulunamadı. Migration çalıştırıldı mı?</p>
          </div>
        )}
      </div>

      {/* Rotate Confirm Modal */}
      {confirmKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rotate-confirm-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg aria-hidden="true" focusable="false" className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 id="rotate-confirm-title" className="text-white font-bold">Secret Rotate Et</h3>
                <p className="text-slate-400 text-sm">{confirmKey}</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-2">
              Yeni bir secret üretilecek. Bu işlem:
            </p>
            <ul className="text-sm text-slate-400 space-y-1 mb-6 list-disc list-inside">
              <li>Tüm aktif kullanıcı oturumlarını geçersiz kılar</li>
              <li>Apps-SSO'da anında aktif olur</li>
              <li>Diğer uygulamaların .env dosyalarının güncellenmesi gerekir</li>
            </ul>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmKey(null)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleRotate(confirmKey)}
                disabled={processing}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {processing ? 'Rotate ediliyor...' : 'Onayla, Rotate Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revert Confirm Modal */}
      {revertKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-white font-bold mb-2">Önceki Versiyona Geri Al</h3>
            <p className="text-slate-300 text-sm mb-4">
              <span className="font-mono text-purple-300">{revertKey}</span> önceki versiyona geri alınacak. Mevcut token'lar geçersiz olur.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setRevertKey(null)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleRevert(revertKey)}
                disabled={processing}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {processing ? 'Geri alınıyor...' : 'Geri Al'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotate Result Modal */}
      {rotateResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold">Rotation Başarılı</h3>
                <p className="text-slate-400 text-sm">{rotateResult.secretKey} → v{rotateResult.version}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-3">Yeni değer (sadece bir kez gösterilir):</p>
            <div className="flex items-center space-x-2 mb-4">
              <code className="flex-1 bg-slate-800 text-green-300 text-xs px-3 py-2 rounded-lg font-mono break-all">
                {rotateResult.newValue}
              </code>
              <button
                onClick={() => handleCopy(rotateResult.newValue)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  copied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {copied ? '✓ Kopyalandı' : 'Kopyala'}
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-200 font-semibold mb-1">Şu uygulamaların .env dosyalarını güncelleyin:</p>
              <div className="flex flex-wrap gap-1">
                {rotateResult.affectedApps.map(app => (
                  <span key={app} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{app}</span>
                ))}
              </div>
              <p className="text-xs text-amber-300 mt-2">Güncelledikten sonra her uygulama için <code className="bg-white/10 px-1 rounded">pm2 restart {'<app>'}</code> çalıştırın.</p>
            </div>

            <button
              onClick={() => setRotateResult(null)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
