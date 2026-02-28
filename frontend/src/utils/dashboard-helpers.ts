// Utility functions extracted from DashboardPage for testability

export const getRoleBadgeStyle = (roleCode?: string): string => {
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
