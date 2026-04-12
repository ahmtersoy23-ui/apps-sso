import { describe, it, expect } from 'vitest';
import {
  getRoleBadgeStyle,
  getAppIcon,
  getAppDisplayName,
  isValidAppUrl,
  TRUSTED_DOMAINS,
} from './dashboard-helpers';

describe('getRoleBadgeStyle', () => {
  it('returns indigo style for admin role', () => {
    const style = getRoleBadgeStyle('admin');
    expect(style).toContain('bg-indigo-500/15');
    expect(style).toContain('text-indigo-300');
  });

  it('returns sky style for editor role', () => {
    const style = getRoleBadgeStyle('editor');
    expect(style).toContain('bg-sky-500/15');
    expect(style).toContain('text-sky-300');
  });

  it('returns slate style for viewer role', () => {
    const style = getRoleBadgeStyle('viewer');
    expect(style).toContain('bg-slate-500/15');
    expect(style).toContain('text-slate-400');
  });

  it('returns slate style for undefined role', () => {
    const style = getRoleBadgeStyle(undefined);
    expect(style).toContain('bg-slate-500/15');
  });

  it('returns slate style for unknown role', () => {
    const style = getRoleBadgeStyle('superadmin');
    expect(style).toContain('bg-slate-500/15');
  });
});

describe('getAppIcon', () => {
  it('returns correct icon path for known apps', () => {
    expect(getAppIcon('stockpulse')).toBe('/icons/stockpulse.svg');
    expect(getAppIcon('pricelab')).toBe('/icons/pricelab.svg');
    expect(getAppIcon('manumaestro')).toBe('/icons/manumaestro.svg');
    expect(getAppIcon('swiftstock')).toBe('/icons/swiftstock.svg');
    expect(getAppIcon('amzsellmetrics')).toBe('/icons/amazon.svg');
    expect(getAppIcon('shipmate')).toBe('/icons/shipmate.svg');
    expect(getAppIcon('fundmate')).toBe('/icons/fundmate.svg');
  });

  it('is case-insensitive', () => {
    expect(getAppIcon('StockPulse')).toBe('/icons/stockpulse.svg');
    expect(getAppIcon('PRICELAB')).toBe('/icons/pricelab.svg');
  });

  it('returns null for unknown app codes', () => {
    expect(getAppIcon('unknown-app')).toBeNull();
    expect(getAppIcon('')).toBeNull();
  });
});

describe('getAppDisplayName', () => {
  it('returns custom display name for amzsellmetrics', () => {
    expect(getAppDisplayName('Amazon Sell Metrics', 'amzsellmetrics')).toBe('AmzSellMetrics');
  });

  it('is case-insensitive for app code lookup', () => {
    expect(getAppDisplayName('Amazon Sell Metrics', 'AmzSellMetrics')).toBe('AmzSellMetrics');
  });

  it('falls back to the provided app name for unknown codes', () => {
    expect(getAppDisplayName('StockPulse', 'stockpulse')).toBe('StockPulse');
    expect(getAppDisplayName('PriceLab', 'pricelab')).toBe('PriceLab');
    expect(getAppDisplayName('My Custom App', 'custom')).toBe('My Custom App');
  });
});

describe('isValidAppUrl', () => {
  it('accepts HTTPS URLs on trusted domains', () => {
    expect(isValidAppUrl('https://iwa.web.tr')).toBe(true);
    expect(isValidAppUrl('https://apps.iwa.web.tr')).toBe(true);
  });

  it('accepts HTTPS URLs on subdomains of trusted domains', () => {
    expect(isValidAppUrl('https://stockpulse.iwa.web.tr')).toBe(true);
    expect(isValidAppUrl('https://pricelab.iwa.web.tr')).toBe(true);
    expect(isValidAppUrl('https://sub.apps.iwa.web.tr')).toBe(true);
  });

  it('rejects HTTP URLs (non-HTTPS)', () => {
    expect(isValidAppUrl('http://iwa.web.tr')).toBe(false);
    expect(isValidAppUrl('http://apps.iwa.web.tr')).toBe(false);
  });

  it('rejects URLs on untrusted domains', () => {
    expect(isValidAppUrl('https://evil.com')).toBe(false);
    expect(isValidAppUrl('https://google.com')).toBe(false);
    expect(isValidAppUrl('https://iwa.web.tr.evil.com')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isValidAppUrl('not-a-url')).toBe(false);
    expect(isValidAppUrl('')).toBe(false);
  });

  it('rejects non-HTTPS protocols', () => {
    expect(isValidAppUrl('ftp://iwa.web.tr')).toBe(false);
    expect(isValidAppUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('TRUSTED_DOMAINS', () => {
  it('contains expected trusted domains', () => {
    expect(TRUSTED_DOMAINS).toContain('iwa.web.tr');
    expect(TRUSTED_DOMAINS).toContain('apps.iwa.web.tr');
  });

  it('has exactly 2 trusted domains', () => {
    expect(TRUSTED_DOMAINS).toHaveLength(2);
  });
});
