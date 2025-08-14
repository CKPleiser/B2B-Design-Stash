/**
 * First-party analytics system
 * Tracks events to Supabase events table - no third-party analytics
 */
import { supabase, isSupabaseAvailable } from './supabase/client';
import { getSession } from './auth';

export type EventName = 
  | 'stash_view'
  | 'gate_impression' 
  | 'gate_block'
  | 'auth_start'
  | 'auth_success'
  | 'auth_error';

export interface EventProps {
  // Common props
  source?: string;
  path?: string;
  
  // Stash view props
  type?: 'list' | 'detail';
  id?: string;
  category?: string;
  
  // Gate props
  quota?: number;
  counts?: {
    listSeen: number;
    detailSeen: number;
  };
  
  // Auth props
  provider?: string;
  error?: string;
  
  // Additional metadata
  [key: string]: unknown;
}

class Analytics {
  private isClient = typeof window !== 'undefined';
  private eventQueue: Array<{ name: EventName; props: EventProps; timestamp: number }> = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 50;

  constructor() {
    if (this.isClient) {
      // Start the flush timer
      this.startFlushTimer();
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });

      // Flush on visibility change (tab switch, minimize)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushSync();
        }
      });
    }
  }

  /**
   * Track an event
   */
  async track(name: EventName, props: EventProps = {}): Promise<void> {
    // Add common metadata
    const enrichedProps = {
      ...props,
      path: this.isClient ? window.location.pathname : props.path,
      timestamp: new Date().toISOString(),
      user_agent: this.isClient ? navigator.userAgent : undefined,
      referrer: this.isClient ? document.referrer : undefined,
    };

    // Console debug in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('[track]', name, enrichedProps);
    }

    if (this.isClient) {
      // Browser: queue for batch processing
      this.eventQueue.push({
        name,
        props: enrichedProps,
        timestamp: Date.now(),
      });

      // Flush if queue is getting large
      if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
        await this.flush();
      }
    } else {
      // Server: write directly
      await this.writeEventDirectly(name, enrichedProps);
    }
  }

  /**
   * Start the flush timer for browser
   */
  private startFlushTimer(): void {
    if (!this.isClient) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Flush queued events (async)
   */
  private async flush(): Promise<void> {
    if (!this.isClient || this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.writeEventsBatch(eventsToFlush);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events on failure (but limit to prevent infinite growth)
      if (this.eventQueue.length < this.MAX_QUEUE_SIZE) {
        this.eventQueue.unshift(...eventsToFlush.slice(-10)); // Only keep last 10
      }
    }
  }

  /**
   * Flush queued events (sync - for page unload)
   */
  private flushSync(): void {
    if (!this.isClient || this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    // Use sendBeacon for reliable delivery during page unload
    if (navigator.sendBeacon) {
      try {
        const payload = JSON.stringify({
          events: eventsToFlush.map(event => ({
            name: event.name,
            props: event.props,
          })),
        });

        navigator.sendBeacon('/api/analytics', payload);
      } catch (error) {
        console.error('Failed to send beacon for analytics:', error);
      }
    }
  }

  /**
   * Write events batch to Supabase
   */
  private async writeEventsBatch(
    events: Array<{ name: EventName; props: EventProps; timestamp: number }>
  ): Promise<void> {
    if (events.length === 0 || !isSupabaseAvailable()) return;

    try {
      // Get current user
      const { session } = await getSession();
      const userId = session?.user?.id || null;

      // Prepare records for insertion
      const records = events.map(event => ({
        name: event.name,
        props: event.props,
        user_id: userId,
        created_at: new Date(event.timestamp).toISOString(),
      }));

      // Insert into Supabase
      const { error } = await supabase!
        .from('events')
        .insert(records);

      if (error) {
        console.error('Supabase events insert error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Analytics batch write failed:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  /**
   * Write single event directly (for server usage)
   */
  private async writeEventDirectly(name: EventName, props: EventProps): Promise<void> {
    try {
      // For server usage, we'll use the API endpoint
      if (this.isClient) {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events: [{ name, props }],
          }),
        });

        if (!response.ok) {
          throw new Error(`Analytics API error: ${response.status}`);
        }
      } else {
        // Direct database write for server contexts would go here
        // For now, we'll skip server-side tracking to keep it simple
        console.debug('[server-track]', name, props);
      }
    } catch (error) {
      console.error('Failed to write analytics event directly:', error);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush
    this.flushSync();
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Convenience functions for common events
export const trackStashView = (type: 'list' | 'detail', id?: string, category?: string) => {
  return analytics.track('stash_view', { type, id, category });
};

export const trackGateImpression = (source: 'list' | 'detail') => {
  return analytics.track('gate_impression', { source });
};

export const trackGateBlock = (quota: number, counts: { listSeen: number; detailSeen: number }) => {
  return analytics.track('gate_block', { quota, counts });
};

export const trackAuthStart = (provider: string, source?: string) => {
  return analytics.track('auth_start', { provider, source });
};

export const trackAuthSuccess = (provider: string, source?: string) => {
  return analytics.track('auth_success', { provider, source });
};

export const trackAuthError = (provider: string, error: string, source?: string) => {
  return analytics.track('auth_error', { provider, error, source });
};

