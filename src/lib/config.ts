/**
 * Application configuration with validation and defaults
 */

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  site: {
    url: string;
  };
  gate: {
    quotaList: number;
    quotaDetail: number;
    mode: 'list' | 'detail';
  };
}

function getEnvVar(name: string, defaultValue?: string, optional = false): string {
  const value = process.env[name];
  if (!value && !defaultValue && !optional) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing environment variable: ${name}`);
      return '';
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || defaultValue || '';
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number for environment variable ${name}: ${value}`);
  }
  return num;
}

function validateGateMode(mode: string): 'list' | 'detail' {
  if (mode === 'list' || mode === 'detail') {
    return mode;
  }
  throw new Error(`Invalid GATE_MODE: ${mode}. Must be 'list' or 'detail'`);
}

/**
 * Get validated application configuration
 */
export function getConfig(): AppConfig {
  return {
    supabase: {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co', true),
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-key', true),
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    site: {
      url: getEnvVar('NEXT_PUBLIC_SITE_URL', 'https://stash.designbuffs.com'),
    },
    gate: {
      quotaList: getEnvNumber('GATE_QUOTA_LIST', 0.4),
      quotaDetail: getEnvNumber('GATE_QUOTA_DETAIL', 3),
      mode: validateGateMode(getEnvVar('GATE_MODE', 'list')),
    },
  };
}

/**
 * Get client-side safe configuration (only public env vars)
 */
export function getClientConfig() {
  const config = getConfig();
  return {
    supabase: {
      url: config.supabase.url,
      anonKey: config.supabase.anonKey,
    },
    site: config.site,
    gate: config.gate,
  };
}