/**
 * Gate SDK for quota tracking and paywall logic
 * Manages anonymous user view limits and paywall display logic
 */
import { getClientConfig } from './config';

const STORAGE_KEY = 'db_stash_gate_v1';

export interface GateStorage {
  listSeen: number;
  detailSeen: number;
  lastReset: string;
  suppressUntil?: string;
}

export interface ShouldGateParams {
  type: 'list' | 'detail';
  totalCount?: number;
}

export interface ShouldGateResult {
  gated: boolean;
  reason: 'quota' | 'forced' | null;
  allowedCount?: number;
  currentCount?: number;
}

class GateSDK {
  private config = getClientConfig();
  private isClient = typeof window !== 'undefined';

  /**
   * Get current gate storage data
   */
  private getStorage(): GateStorage {
    if (!this.isClient) {
      return this.getDefaultStorage();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return this.getDefaultStorage();
      }

      const data = JSON.parse(stored) as GateStorage;
      
      // Check if we need to reset daily counts
      const lastReset = new Date(data.lastReset);
      const now = new Date();
      const resetTime = new Date(now);
      resetTime.setHours(0, 0, 0, 0);

      if (lastReset < resetTime) {
        return this.getDefaultStorage();
      }

      return data;
    } catch (error) {
      console.error('Error reading gate storage:', error);
      return this.getDefaultStorage();
    }
  }

  /**
   * Save gate storage data
   */
  private setStorage(data: GateStorage): void {
    if (!this.isClient) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving gate storage:', error);
    }
  }

  /**
   * Get default storage structure
   */
  private getDefaultStorage(): GateStorage {
    return {
      listSeen: 0,
      detailSeen: 0,
      lastReset: new Date().toISOString(),
    };
  }

  /**
   * Check if user should be gated
   */
  shouldGate({ type, totalCount }: ShouldGateParams): ShouldGateResult {
    // Skip gating on server
    if (!this.isClient) {
      return { gated: false, reason: null };
    }

    // Check for middleware override (internal previews)
    if (document.cookie.includes('gate=off')) {
      return { gated: false, reason: null };
    }

    // Check for bot traffic
    if (this.isBotTraffic()) {
      return { gated: false, reason: null };
    }

    const storage = this.getStorage();

    // Check if currently suppressed
    if (storage.suppressUntil) {
      const suppressUntil = new Date(storage.suppressUntil);
      if (new Date() < suppressUntil) {
        return { gated: false, reason: null };
      }
    }

    // Check quota based on mode
    if (this.config.gate.mode === 'list' && type === 'list') {
      if (totalCount === undefined) {
        return { gated: false, reason: null };
      }
      
      const allowedCount = Math.ceil(totalCount * this.config.gate.quotaList);
      return {
        gated: storage.listSeen >= allowedCount,
        reason: storage.listSeen >= allowedCount ? 'quota' : null,
        allowedCount,
        currentCount: storage.listSeen,
      };
    }

    if (this.config.gate.mode === 'detail' && type === 'detail') {
      const allowedCount = this.config.gate.quotaDetail;
      return {
        gated: storage.detailSeen >= allowedCount,
        reason: storage.detailSeen >= allowedCount ? 'quota' : null,
        allowedCount,
        currentCount: storage.detailSeen,
      };
    }

    return { gated: false, reason: null };
  }

  /**
   * Record a view
   */
  recordView(type: 'list' | 'detail'): void {
    if (!this.isClient) return;

    const storage = this.getStorage();
    
    if (type === 'list') {
      storage.listSeen += 1;
    } else if (type === 'detail') {
      storage.detailSeen += 1;
    }

    this.setStorage(storage);
  }

  /**
   * Suppress gate for a duration
   */
  suppress(durationMs: number = 30 * 60 * 1000): void { // Default: 30 minutes
    if (!this.isClient) return;

    const storage = this.getStorage();
    storage.suppressUntil = new Date(Date.now() + durationMs).toISOString();
    this.setStorage(storage);
  }

  /**
   * Clear suppression
   */
  clearSuppression(): void {
    if (!this.isClient) return;

    const storage = this.getStorage();
    delete storage.suppressUntil;
    this.setStorage(storage);
  }

  /**
   * Reset all counts (for testing or manual reset)
   */

  reset(): void {
    if (!this.isClient) return;

    this.setStorage(this.getDefaultStorage());
  }

  /**
   * Get current counts for debugging
   */
  getCounts(): { listSeen: number; detailSeen: number; suppressedUntil?: string } {
    const storage = this.getStorage();
    return {
      listSeen: storage.listSeen,
      detailSeen: storage.detailSeen,
      suppressedUntil: storage.suppressUntil,
    };
  }

  /**
   * Check if this looks like bot traffic
   */
  private isBotTraffic(): boolean {
    if (!this.isClient) return false;

    // Basic bot detection
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'facebookexternalhit', 'twitterbot', 'linkedinbot',
      'slackbot', 'whatsapp', 'telegram'
    ];

    const isBot = botPatterns.some(pattern => userAgent.includes(pattern));
    const hasWebDriver = 'webdriver' in navigator || !!(navigator as unknown as { webdriver?: boolean }).webdriver;

    return isBot || hasWebDriver;
  }

  /**
   * Calculate visible items for list view
   */
  getVisibleItemsCount(totalItems: number): number {
    if (this.config.gate.mode !== 'list') return totalItems;

    const allowedCount = Math.ceil(totalItems * this.config.gate.quotaList);
    return Math.min(allowedCount, totalItems);
  }

  /**
   * Check if an item should be blurred in list view
   */
  shouldBlurItem(itemIndex: number, totalItems: number): boolean {
    if (this.config.gate.mode !== 'list') return false;

    const visibleCount = this.getVisibleItemsCount(totalItems);
    return itemIndex >= visibleCount;
  }
}

export const gate = new GateSDK();