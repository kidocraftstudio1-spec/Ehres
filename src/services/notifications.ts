/**
 * Notification Service for PWA & Web Notifications
 * Coordinates Notifications API, Service Worker registration,
 * and scheduled alerts for prayers, task deadlines, and pomodoro sessions.
 */

export class NotificationService {
  private static instance: NotificationService;
  private scheduledTimeouts: number[] = [];

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Checks if browser supports Notifications
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Current permission status
   */
  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Request permission explicitly (e.g. from Settings button)
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return false;
    }
  }

  /**
   * Show an immediate or queued notification via Service Worker when available,
   * falling back to native Notification constructor.
   */
  public async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      dir: 'rtl',
      lang: 'ar',
      ...options,
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, defaultOptions);
          return;
        }
      }
      // Fallback
      new Notification(title, defaultOptions);
    } catch (e) {
      console.warn('Failed to display notification:', e);
    }
  }

  /**
   * Play haptic feedback vibration if supported
   */
  public vibrate(pattern: number | number[] = [200, 100, 200]): void {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silent catch for devices that disallow vibration without user gesture
      }
    }
  }

  /**
   * Clear any existing in-memory scheduled timeouts
   */
  public clearScheduledAlerts(): void {
    this.scheduledTimeouts.forEach((id) => clearTimeout(id));
    this.scheduledTimeouts = [];
  }

  /**
   * Schedule an alert for an upcoming deadline or prayer
   */
  public scheduleAlert(
    title: string,
    body: string,
    targetTimestamp: number,
    tag?: string
  ): void {
    const delay = targetTimestamp - Date.now();
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) {
      // Don't schedule past events or events more than 24h away in memory
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      await this.sendNotification(title, {
        body,
        tag: tag || 'ehres-alert',
      });
      this.vibrate([300, 150, 300]);
    }, delay);

    this.scheduledTimeouts.push(timeoutId);
  }

  /**
   * Placeholder for future Web Push / Firebase Cloud Messaging (FCM) token registration.
   */
  public async registerPushSubscription(): Promise<string | null> {
    console.log('Push subscription placeholder ready for future Firebase Cloud Messaging.');
    return null;
  }
}

export const notificationService = NotificationService.getInstance();
