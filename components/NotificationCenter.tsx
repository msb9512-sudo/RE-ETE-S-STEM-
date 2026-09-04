import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Settings2, 
  AlertTriangle, 
  ShieldAlert, 
  ClipboardCheck, 
  Info, 
  ExternalLink,
  Volume2,
  VolumeX,
  Laptop,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AppNotification, NotificationSettings, ViewState } from '../types';
import { NotificationService, soundPlayer } from '../services/notificationService';

interface NotificationCenterProps {
  onNavigate: (view: ViewState) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical_stock' | 'license' | 'counting_variance'>('all');
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [nativePerm, setNativePerm] = useState(NotificationService.getNativePermissionStatus());
  const [testSent, setTestSent] = useState(false);

  // Bildirimleri dinle
  useEffect(() => {
    const unsubList = NotificationService.subscribe((list) => {
      setNotifications(list);
    });

    const unsubToast = NotificationService.subscribeToasts((toast) => {
      setToasts((prev) => [toast, ...prev.slice(0, 3)]);
      // 6 saniye sonra toast'ı kaldır
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 6000);
    });

    return () => {
      unsubList();
      unsubToast();
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter((n) => !n.read && n.severity === 'critical').length;

  const handleUpdateSettings = (updates: Partial<NotificationSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    NotificationService.saveSettings(next);
  };

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestNativePermission();
    setNativePerm(NotificationService.getNativePermissionStatus());
    if (granted) {
      soundPlayer.play('info');
    }
  };

  const handleTestNotification = () => {
    NotificationService.sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleNotificationClick = (item: AppNotification) => {
    NotificationService.markAsRead(item.id);
    if (item.targetView) {
      onNavigate(item.targetView);
      setIsOpen(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Az önce';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} sa önce`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} gün önce`;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getIcon = (type: AppNotification['type'], severity: AppNotification['severity']) => {
    if (type === 'critical_stock') {
      return <AlertTriangle size={18} className="text-red-500" />;
    }
    if (type === 'license') {
      return <ShieldAlert size={18} className={severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />;
    }
    if (type === 'counting_variance') {
      return <ClipboardCheck size={18} className="text-amber-500" />;
    }
    return <Info size={18} className="text-indigo-500" />;
  };

  return (
    <>
      {/* 1. Global Zil Butonu */}
      <div className="relative">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setNativePerm(NotificationService.getNativePermissionStatus());
            }
          }}
          title="Bildirim Merkezi"
          className={`relative p-2.5 rounded-2xl border transition-all duration-200 flex items-center justify-center ${
            isOpen
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 ring-4 ring-indigo-50'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-sm'
          }`}
        >
          <Bell size={20} className={criticalCount > 0 ? 'animate-bounce' : ''} />
          
          {unreadCount > 0 && (
            <span className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-white shadow-sm ${
              criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* 2. Bildirim Paneli (Açılır Menü) */}
        {isOpen && (
          <>
            {/* Arka Plan Tıklama Kapatıcı */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />

            <div className="absolute right-0 top-12 z-50 w-[380px] sm:w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
              {/* Başlık Çubuğu */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Bildirim Merkezi</h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {unreadCount > 0 ? `${unreadCount} okunmamış uyarı` : 'Tüm bildirimler güncel'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    title="Bildirim Ayarları"
                    className={`p-2 rounded-xl transition-colors ${
                      showSettings ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Settings2 size={17} />
                  </button>
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={() => NotificationService.markAllAsRead()}
                        title="Tümünü Okundu Say"
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      >
                        <CheckCheck size={17} />
                      </button>
                      <button
                        onClick={() => NotificationService.clearAll()}
                        title="Tümünü Temizle"
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={17} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Ayarlar Paneli (Açılırsa) */}
              {showSettings && (
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3.5 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-black text-slate-700 uppercase tracking-wider text-[11px]">
                      Bildirim Tercihleri
                    </span>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-slate-400 hover:text-slate-600 text-[11px] font-bold"
                    >
                      Kapat
                    </button>
                  </div>

                  {/* Native / Electron Bildirim */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Laptop size={14} className="text-indigo-600" />
                        Masaüstü (Native) Bildirimleri
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {nativePerm === 'electron' 
                          ? 'Electron Native & Sistem Tepsisi hazır' 
                          : nativePerm === 'granted' 
                          ? 'Web Bildirim izni verildi' 
                          : 'Pencereler arka plandayken bildirim alın'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {nativePerm !== 'electron' && nativePerm !== 'granted' && (
                        <button
                          onClick={handleRequestPermission}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black transition-colors"
                        >
                          İzin Ver
                        </button>
                      )}
                      <input
                        type="checkbox"
                        checked={settings.enableNative}
                        onChange={(e) => handleUpdateSettings({ enableNative: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Sesli Uyarılar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-700 flex items-center gap-1.5">
                        {settings.enableAudio ? <Volume2 size={14} className="text-indigo-600" /> : <VolumeX size={14} className="text-slate-400" />}
                        Sesli Uyarı Çanı
                      </p>
                      <p className="text-[10px] text-slate-400">Kritik stok veya uyarılarda sinyal çalar</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableAudio}
                      onChange={(e) => handleUpdateSettings({ enableAudio: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Toast Balonları */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-700">Ekran Köşesi Balonları</p>
                      <p className="text-[10px] text-slate-400">Yeni bildirimlerde sağ üstte kayan kart göster</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableToasts}
                      onChange={(e) => handleUpdateSettings({ enableToasts: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Test Butonu */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">Yapılandırmayı dene:</span>
                    <button
                      onClick={handleTestNotification}
                      disabled={testSent}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold shadow transition-all active:scale-95"
                    >
                      {testSent ? (
                        <>
                          <Check size={13} /> Test Gönderildi!
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} /> Test Bildirimi Gönder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Filtreleme Sekmeleri */}
              <div className="flex items-center gap-1 p-2 bg-slate-50/70 border-b border-slate-100 overflow-x-auto text-[11px] font-bold">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    activeFilter === 'all'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tümü ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('critical_stock')}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    activeFilter === 'critical_stock'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Kritik Stok ({notifications.filter((n) => n.type === 'critical_stock').length})
                </button>
                <button
                  onClick={() => setActiveFilter('license')}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    activeFilter === 'license'
                      ? 'bg-white text-amber-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lisans ({notifications.filter((n) => n.type === 'license').length})
                </button>
                <button
                  onClick={() => setActiveFilter('counting_variance')}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    activeFilter === 'counting_variance'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sayım Farkı ({notifications.filter((n) => n.type === 'counting_variance').length})
                </button>
              </div>

              {/* Bildirim Listesi */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-[220px] max-h-[420px]">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Bell size={22} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">Bildirim Bulunmuyor</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Kritik stok seviyesi, lisans bitişi veya sayım farkı durumlarında anında burada ve masaüstünüzde bilgilendirileceksiniz.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                        item.read
                          ? 'bg-white border-slate-100 opacity-75 hover:opacity-100 hover:border-slate-200'
                          : item.severity === 'critical'
                          ? 'bg-red-50/50 border-red-200 shadow-sm hover:border-red-300'
                          : item.severity === 'warning'
                          ? 'bg-amber-50/40 border-amber-200 shadow-sm hover:border-amber-300'
                          : 'bg-indigo-50/30 border-indigo-200 shadow-sm hover:border-indigo-300'
                      }`}
                    >
                      {/* Sol İkon */}
                      <div className="mt-0.5 shrink-0">
                        <div className={`p-2 rounded-xl ${
                          item.severity === 'critical' ? 'bg-red-100' :
                          item.severity === 'warning' ? 'bg-amber-100' : 'bg-indigo-100'
                        }`}>
                          {getIcon(item.type, item.severity)}
                        </div>
                      </div>

                      {/* İçerik */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className={`text-xs font-black truncate ${
                            item.read ? 'text-slate-700' : 'text-slate-900'
                          }`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {formatTimeAgo(item.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Aksiyon Çubuğu */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          {item.targetView ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                              <span>İlgili Ekrana Git</span>
                              <ArrowRight size={11} />
                            </span>
                          ) : (
                            <span />
                          )}

                          <div className="flex items-center gap-2">
                            {!item.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  NotificationService.markAsRead(item.id);
                                }}
                                title="Okundu İşaretle"
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-700"
                              >
                                Okundu
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                NotificationService.deleteNotification(item.id);
                              }}
                              title="Sil"
                              className="text-slate-400 hover:text-red-500 p-0.5"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Alt Bilgi */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Otomatik Arka Plan Denetimi</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Aktif
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Floating Toast Bildirimleri (Sağ Üst Köşe) */}
      <div className="fixed top-5 right-5 z-[9999] space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => handleNotificationClick(toast)}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-slide-in cursor-pointer flex gap-3.5 items-start ${
              toast.severity === 'critical'
                ? 'bg-red-900/95 text-white border-red-700'
                : toast.severity === 'warning'
                ? 'bg-amber-900/95 text-white border-amber-700'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            <div className="p-2 rounded-xl bg-white/10 shrink-0 mt-0.5">
              {getIcon(toast.type, toast.severity)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-black text-xs">{toast.title}</h5>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="text-white/60 hover:text-white p-0.5"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[11px] text-white/85 mt-1 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>
              {toast.targetView && (
                <p className="text-[10px] text-indigo-300 font-bold mt-1.5 flex items-center gap-1">
                  Görüntülemek için tıklayın <ArrowRight size={10} />
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
