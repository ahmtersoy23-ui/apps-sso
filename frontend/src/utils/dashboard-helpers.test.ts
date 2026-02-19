import { describe, it, expect } from 'vitest';
import {
  getRoleBadgeStyle,
  getAppIcon,
  getAppDisplayName,
  isValidAppUrl,
  TRUSTED_DOMAINS,
} from './dashboard-helpers';

describe('getRoleBadgeStyle', () => {
  it('returns red/pink gradient for admin role', () => {
    const style = getRoleBadgeStyle('admin');
    expect(style).toContain('from-red-500');
    expect(style).toContain('to-pink-500');
  });

  it('returns blue/cyan gradient for editor role', () => {
    const style = getRoleBadgeStyle('editor');
    expect(style).toContain('from-blue-500');
    expect(style).toContain('to-cyan-500');
  });

  it('returns gray gradient for viewer role', () => {
    const style = getRoleBadgeStyle('viewer');
    expect(style).toContain('from-gray-400');
    expect(style).toContain('to-gray-500');
  });

  it('returns gray gradient for undefined role', () => {
    const style = getRoleBadgeStyle(undefined);
    expect(style).toContain('from-gray-400');
  });

  it('returns gray gradient for unknown role', () => {
    const style = getRoleBadgeStyle('superadmin');
    expect(style).toContain('from-gray-400');
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
