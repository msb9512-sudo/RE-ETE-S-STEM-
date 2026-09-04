import { AppNotification, NotificationSettings, InventoryItem, LicenseData, CountSession, ViewState } from '../types';

const STORAGE_NOTIFICATIONS_KEY = 'otelpro_notifications_v1';
const STORAGE_SETTINGS_KEY = 'otelpro_notification_settings_v1';
const STORAGE_COOLDOWN_KEY = 'otelpro_notif_cooldown_v1';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enableNative: true,
  enableAudio: true,
  enableToasts: true,
  criticalStockAlert: true,
  licenseAlert: true,
  countingVarianceAlert: true,
  varianceThreshold: 500, // 500 TL üzeri farklar için bildirim
};

// Web Audio API ile harici ses dosyasına ihtiyaç duymayan profesyonel ses sentezleyici
class NotificationSoundPlayer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  play(severity: 'critical' | 'warning' | 'info' = 'info') {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);

      if (severity === 'critical') {
        // Çift tonlu acil uyarı sinyali (600Hz -> 850Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } else if (severity === 'warning') {
        // Uyarı sinyali (480Hz -> 640Hz)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.18);

        gainNode.gain.setValueAtTime(0.18, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Bilgilendirici melodik sinyal
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
}

export const soundPlayer = new NotificationSoundPlayer();

// Bildirim Servisi Ana Sınıfı
export class NotificationService {
  private static listeners: ((notifications: AppNotification[]) => void)[] = [];
  private static toastListeners: ((toast: AppNotification) => void)[] = [];

  // Ayarları Getir
  static getSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error reading notification settings:', e);
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  // Ayarları Kaydet
  static saveSettings(settings: NotificationSettings) {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving notification settings:', e);
    }
  }

  // Kayıtlı Bildirimleri Getir
  static getNotifications(): AppNotification[] {
    try {
      const saved = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading notifications:', e);
    }
    return [];
  }

  // Bildirimleri Kaydet & Dinleyicileri Tetikle
  private static saveNotifications(list: AppNotification[]) {
    try {
      // En son 60 bildirimi sakla
      const trimmed = list.slice(0, 60);
      localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(trimmed));
      this.listeners.forEach(cb => cb(trimmed));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }

  // Dinleyici Ekle (Liste Güncellemeleri İçin)
  static subscribe(callback: (notifications: AppNotification[]) => void) {
    this.listeners.push(callback);
    callback(this.getNotifications());
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Dinleyici Ekle (Toast Popup'lar İçin)
  static subscribeToasts(callback: (toast: AppNotification) => void) {
    this.toastListeners.push(callback);
    return () => {
      this.toastListeners = this.toastListeners.filter(cb => cb !== callback);
    };
  }

  // Masaüstü Bildirim İzni İste (Web API için)
  static async requestNativePermission(): Promise<boolean> {
    if (window.ipcRenderer) {
      // Electron ortamında doğrudan desteklenir
      return true;
    }
    if ('Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    }
    return false;
  }

  // Native Bildirim Durumu
  static getNativePermissionStatus(): 'electron' | 'granted' | 'denied' | 'default' | 'unsupported' {
    if (window.ipcRenderer) {
      return 'electron';
    }
    if ('Notification' in window) {
      return Notification.permission as 'granted' | 'denied' | 'default';
    }
    return 'unsupported';
  }

  // Cooldown Kontrolü (Aynı bildirimi sürekli tekrarlamayı önler)
  private static shouldTriggerAlert(cooldownKey: string, cooldownMinutes: number = 15): boolean {
    try {
      const cooldownMap: Record<string, number> = JSON.parse(localStorage.getItem(STORAGE_COOLDOWN_KEY) || '{}');
      const last = cooldownMap[cooldownKey];
      const now = Date.now();
      if (last && now - last < cooldownMinutes * 60 * 1000) {
        return false;
      }
      cooldownMap[cooldownKey] = now;
      localStorage.setItem(STORAGE_COOLDOWN_KEY, JSON.stringify(cooldownMap));
      return true;
    } catch {
      return true;
    }
  }

  // Native Masaüstü Bildirimi Gönder (Electron veya Web API)
  static async triggerNativeNotification(title: string, body: string, urgency: 'normal' | 'critical' | 'low' = 'normal'): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.enableNative) return false;

    // 1. Electron Native Bildirimi
    if (window.ipcRenderer && typeof window.ipcRenderer.invoke === 'function') {
      try {
        const res = await window.ipcRenderer.invoke('show-native-notification', {
          title,
          body,
          silent: !settings.enableAudio,
          urgency,
        });
        if (res && res.success) {
          return true;
        }
      } catch (err) {
        console.warn('Electron native notification failed, falling back to Web API:', err);
      }
    }

    // 2. HTML5 Web Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/hotel-icon.png',
          tag: 'otelpro-alert',
          silent: !settings.enableAudio,
        });
        return true;
      } catch (e) {
        console.warn('Web notification failed:', e);
      }
    }

    return false;
  }

  // Yeni Bildirim Ekle ve Bildirimi Göster
  static dispatchNotification(data: {
    type: AppNotification['type'];
    title: string;
    message: string;
    severity?: 'critical' | 'warning' | 'info';
    targetView?: ViewState;
    metadata?: Record<string, any>;
    cooldownKey?: string;
    cooldownMinutes?: number;
    forceNative?: boolean;
  }): AppNotification | null {
    const settings = this.getSettings();

    // Cooldown kontrolü
    if (data.cooldownKey && !this.shouldTriggerAlert(data.cooldownKey, data.cooldownMinutes ?? 20)) {
      return null;
    }

    const severity = data.severity || 'info';

    const newNotification: AppNotification = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      type: data.type,
      title: data.title,
      message: data.message,
      timestamp: Date.now(),
      read: false,
      severity,
      targetView: data.targetView,
      metadata: data.metadata,
    };

    // 1. Listeye Ekle
    const current = this.getNotifications();
    this.saveNotifications([newNotification, ...current]);

    // 2. Ses Çal
    if (settings.enableAudio) {
      soundPlayer.play(severity);
    }

    // 3. Uygulama İçi Toast Göster
    if (settings.enableToasts) {
      this.toastListeners.forEach(cb => cb(newNotification));
    }

    // 4. Masaüstü / Native Bildirim Göster
    if (settings.enableNative || data.forceNative) {
      const urgency = severity === 'critical' ? 'critical' : severity === 'warning' ? 'normal' : 'low';
      this.triggerNativeNotification(data.title, data.message, urgency);
    }

    return newNotification;
  }

  // Okundu Olarak İşaretle
  static markAsRead(id: string) {
    const list = this.getNotifications();
    const updated = list.map(item => item.id === id ? { ...item, read: true } : item);
    this.saveNotifications(updated);
  }

  // Tümünü Okundu İşaretle
  static markAllAsRead() {
    const list = this.getNotifications();
    const updated = list.map(item => ({ ...item, read: true }));
    this.saveNotifications(updated);
  }

  // Bildirimi Sil
  static deleteNotification(id: string) {
    const list = this.getNotifications();
    const updated = list.filter(item => item.id !== id);
    this.saveNotifications(updated);
  }

  // Tüm Bildirimleri Temizle
  static clearAll() {
    this.saveNotifications([]);
  }

  // --- KRİTİK KONTROLLER (Periyodik veya Durum Değişikliklerinde Çağrılır) ---

  // 1. Kritik Stok Kontrolü
  static checkCriticalStock(inventory: InventoryItem[]) {
    const settings = this.getSettings();
    if (!settings.criticalStockAlert) return;

    const criticalItems = inventory.filter(item => item.quantity <= item.minLevel);
    if (criticalItems.length === 0) return;

    // En kritik 2 ürünün bilgisini özetle
    const sampleNames = criticalItems.slice(0, 2).map(i => `${i.name} (${i.quantity} ${i.unit} / Min: ${i.minLevel})`).join(', ');
    const moreText = criticalItems.length > 2 ? ` ve ${criticalItems.length - 2} ürün daha` : '';

    this.dispatchNotification({
      type: 'critical_stock',
      title: '🚨 Kritik Stok Seviyesi Uyarısı',
      message: `${criticalItems.length} ürün kritik stok seviyesinin altında: ${sampleNames}${moreText}. Lütfen satın alma veya depo kontrolü yapın.`,
      severity: 'critical',
      targetView: 'inventory',
      cooldownKey: `critical-stock-batch-${criticalItems.length}`,
      cooldownMinutes: 15,
      metadata: { itemCount: criticalItems.length, itemIds: criticalItems.map(i => i.id) },
    });
  }

  // 2. Lisans Süresi Kontrolü
  static checkLicenseStatus(license: LicenseData | null) {
    const settings = this.getSettings();
    if (!settings.licenseAlert || !license) return;

    const now = Date.now();
    const diffMs = license.expirationDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) {
      // Süre dolmuş
      this.dispatchNotification({
        type: 'license',
        title: '⚠️ Lisans Süreniz Doldu!',
        message: 'Program lisans süreniz sona erdi. Sistem şu anda salt okunur modda çalışmaktadır. İşlemlere devam etmek için lisansınızı yenileyin.',
        severity: 'critical',
        targetView: 'settings',
        cooldownKey: 'license-expired-alert',
        cooldownMinutes: 60,
      });
    } else if (diffDays <= 7) {
      // 7 gün ve daha az kalmış
      const severity = diffDays <= 2 ? 'critical' : 'warning';
      this.dispatchNotification({
        type: 'license',
        title: `⏰ Lisansınızın Bitmesine ${diffDays} Gün Kaldı`,
        message: `Program lisansınız ${new Date(license.expirationDate).toLocaleDateString('tr-TR')} tarihinde sona erecektir. Kesintisiz kullanım için Ayarlar > Lisans menüsünden yeni lisans girebilirsiniz.`,
        severity,
        targetView: 'settings',
        cooldownKey: `license-expiring-${diffDays}`,
        cooldownMinutes: 180, // 3 saatte bir
      });
    }
  }

  // 3. Sayım Farkı Kontrolü
  static checkCountingVariance(countSessions: CountSession[]) {
    const settings = this.getSettings();
    if (!settings.countingVarianceAlert || !countSessions || countSessions.length === 0) return;

    // En son tamamlanan sayımı kontrol et
    const completedSessions = countSessions.filter(s => s.status === 'COMPLETED');
    if (completedSessions.length === 0) return;

    const latest = completedSessions[completedSessions.length - 1];
    
    // Toplam mutlak fark maliyeti
    const totalVarianceCost = latest.items.reduce((acc, curr) => acc + Math.abs(curr.varianceCost), 0);

    if (totalVarianceCost >= settings.varianceThreshold) {
      const negativeCount = latest.items.filter(i => i.variance < 0).length;
      
      this.dispatchNotification({
        type: 'counting_variance',
        title: '📊 Yüksek Sayım Farkı Tespit Edildi',
        message: `Son tamamlanan sayımda toplam ₺${totalVarianceCost.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} tutarında fark tespit edildi (${negativeCount} üründe eksik). Detayları Sayım & Fire ekranında inceleyebilirsiniz.`,
        severity: 'warning',
        targetView: 'counting',
        cooldownKey: `counting-variance-session-${latest.id}`,
        cooldownMinutes: 60,
        metadata: { sessionId: latest.id, varianceCost: totalVarianceCost },
      });
    }
  }

  // 4. Manuel Test Bildirimi
  static sendTestNotification() {
    return this.dispatchNotification({
      type: 'system',
      title: '🔔 OtelPro Bildirim Sistemi Testi',
      message: 'Native Electron ve masaüstü bildirim sistemi başarıyla yapılandırıldı ve çalışıyor!',
      severity: 'info',
      forceNative: true,
    });
  }
}
