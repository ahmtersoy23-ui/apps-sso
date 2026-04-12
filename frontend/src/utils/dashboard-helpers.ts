// Utility functions extracted from DashboardPage for testability

export const getRoleBadgeStyle = (roleCode?: string): string => {
  switch (roleCode) {
    case 'admin':
      return 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30';
    case 'editor':
      return 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30';
    case 'viewer':
      return 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30';
    default:
      return 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30';
  }
};

export const getAppIcon = (appCode: string): string | null => {
  const icons: Record<string, string> = {
    'amzsellmetrics': '/icons/amazon.svg',
    'stockpulse': '/icons/stockpulse.svg',
    'pricelab': '/icons/pricelab.svg',
    'manumaestro': '/icons/manumaestro.svg',
    'swiftstock': '/icons/swiftstock.svg',
    'shipmate': '/icons/shipmate.svg',
    'fundmate': '/icons/fundmate.svg',
    'databridge': '/icons/databridge.svg',
    'adpilot': '/icons/adpilot.svg',
  };
  return icons[appCode.toLowerCase()] || null;
};

export const getAppDisplayName = (appName: string, appCode: string): string => {
  const displayNames: Record<string, string> = {
    'amzsellmetrics': 'AmzSellMetrics',
  };
  return displayNames[appCode.toLowerCase()] || appName;
};

export const TRUSTED_DOMAINS = ['iwa.web.tr', 'apps.iwa.web.tr'];

export const isValidAppUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return TRUSTED_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};
