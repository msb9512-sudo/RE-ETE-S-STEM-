import React, { useState, useEffect } from 'react';
import { UIPreferences, ThemeColor, FontFamily, ShapeRadius, InterfaceDensity, CardStyle } from '../types';
import { loadUIPreferences, saveUIPreferences, DEFAULT_UI_PREFERENCES, applyUIPreferences } from '../services/themeService';
import { Palette, Type, Sliders, Check, Sparkles, RefreshCw, Eye, Sun, Moon, Layers, ShieldCheck, Box, MoveHorizontal, CheckCircle2 } from 'lucide-react';

interface UISettingsProps {
  isReadonly?: boolean;
}

export const UISettings: React.FC<UISettingsProps> = ({ isReadonly = false }) => {
  const [preferences, setPreferences] = useState<UIPreferences>(loadUIPreferences());
  const [savedNotice, setSavedNotice] = useState(false);

  // Tercihler her değiştiğinde anlık canlı uygula
  const handleUpdate = (updates: Partial<UIPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    applyUIPreferences(updated);
  };

  const handleSave = () => {
    saveUIPreferences(preferences);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    setPreferences(DEFAULT_UI_PREFERENCES);
    saveUIPreferences(DEFAULT_UI_PREFERENCES);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Initial load sync
  useEffect(() => {
    applyUIPreferences(preferences);
  }, []);

  const THEMES: { id: ThemeColor; name: string; desc: string; bg: string; color: string; border: string; previewBadge: string }[] = [
    { id: 'indigo', name: 'Klasik Indigo', desc: 'Orijinal canlı mor-mavi tonları', bg: 'bg-indigo-600', color: 'text-indigo-600', border: 'border-indigo-600', previewBadge: 'bg-indigo-100 text-indigo-700' },
    { id: 'emerald', name: 'Zümrüt Yeşili', desc: 'Doğal, taze ve göz yormayan otel rengi', bg: 'bg-emerald-600', color: 'text-emerald-600', border: 'border-emerald-600', previewBadge: 'bg-emerald-100 text-emerald-800' },
    { id: 'ocean', name: 'Okyanus & Teal', desc: 'Ferah deniz ve turkuaz esintisi', bg: 'bg-cyan-600', color: 'text-cyan-600', border: 'border-cyan-600', previewBadge: 'bg-cyan-100 text-cyan-800' },
    { id: 'amber', name: 'Altın Kehribar', desc: 'Lüks, sıcak ve prestijli butik atmosferi', bg: 'bg-amber-600', color: 'text-amber-600', border: 'border-amber-600', previewBadge: 'bg-amber-100 text-amber-800' },
    { id: 'rose', name: 'Gül & Bordo', desc: 'Şık restoran, bistro ve kafe zarafeti', bg: 'bg-rose-600', color: 'text-rose-600', border: 'border-rose-600', previewBadge: 'bg-rose-100 text-rose-800' },
    { id: 'slate', name: 'Titanyum Grafit', desc: 'Modern, minimalist kurumsal gri tonları', bg: 'bg-slate-700', color: 'text-slate-700', border: 'border-slate-700', previewBadge: 'bg-slate-200 text-slate-800' },
    { id: 'dark', name: 'Gece Modu (Dark)', desc: 'Gözü dinlendiren derin obsidyen koyu tema', bg: 'bg-slate-900', color: 'text-indigo-400', border: 'border-indigo-500', previewBadge: 'bg-slate-800 text-slate-200' },
  ];

  const FONTS: { id: FontFamily; name: string; style: string; sample: string; desc: string }[] = [
    { id: 'inter', name: 'Inter', style: "font-['Inter']", sample: 'Hızlı Stok & Adisyon Terminali 123', desc: 'Endüstri standardı dengeli ve net tipografi' },
    { id: 'jakarta', name: 'Plus Jakarta Sans', style: "font-['Plus_Jakarta_Sans']", sample: 'Hızlı Stok & Adisyon Terminali 123', desc: 'Modern, canlı ve yüksek kaliteli kurumsal estetik' },
    { id: 'outfit', name: 'Outfit', style: "font-['Outfit']", sample: 'Hızlı Stok & Adisyon Terminali 123', desc: 'Yuvarlak geometrik hatlar, fütüristik görünüm' },
    { id: 'montserrat', name: 'Montserrat', style: "font-['Montserrat']", sample: 'Hızlı Stok & Adisyon Terminali 123', desc: 'Güçlü, karakterli ve belirgin şehirli tipografi' },
    { id: 'poppins', name: 'Poppins', style: "font-['Poppins']", sample: 'Hızlı Stok & Adisyon Terminali 123', desc: 'Yumuşak, samimi ve son derece okunaklı' },
    { id: 'roboto', name: 'Roboto', style: "font-['Roboto']", sample: 'Hızlı Stok & Adisyon Terminali 123', desc: 'Klasik, nötr ve kompakt veri ekranı uyumu' },
  ];

  const RADII: { id: ShapeRadius; name: string; sampleClass: string; desc: string }[] = [
    { id: 'sharp', name: 'Keskin (Sharp)', sampleClass: 'rounded-none border', desc: '4px / Düz minimalist köşeler' },
    { id: 'standard', name: 'Dengeli (Standart)', sampleClass: 'rounded-xl', desc: '14px / Klasik zarif kıvrımlar' },
    { id: 'soft', name: 'Yumuşak (Soft)', sampleClass: 'rounded-2xl', desc: '20px / Belirgin modern kavisler' },
    { id: 'pill', name: 'Oval (Pill Kapsül)', sampleClass: 'rounded-full', desc: 'Tam yuvarlatılmış hap formlar' },
  ];

  const CARD_STYLES: { id: CardStyle; name: string; desc: string; preview: string }[] = [
    { id: 'shadow', name: 'Hafif Gölgeli (Klasik)', desc: 'Yumuşak derinlikli temiz kartlar', preview: 'shadow-md border border-slate-100' },
    { id: 'border', name: 'Çerçeveli & Düz (Minimal)', desc: 'Gölgeler kapalı, belirgin sınır çizgileri', preview: 'border-2 border-slate-300 shadow-none' },
    { id: 'glass', name: 'Buzlu Cam (Glassmorphism)', desc: 'Yarı saydam bulanık modern cam efekti', preview: 'bg-white/80 backdrop-blur-md border border-white/60 shadow-lg' },
    { id: 'contrast', name: 'Yüksek Kontrast', desc: 'Sert hatlar ve net gölgeler', preview: 'border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a]' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Üst Başlık & Eylem Çubuğu */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <Palette className="text-indigo-600" size={26} />
            Arayüz & Tema Ayarları
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Programın renk temasını, yazı fontlarını, köşe şekillerini ve arayüz yoğunluğunu dilediğiniz gibi özelleştirin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all active:scale-95"
          >
            <RefreshCw size={14} /> Varsayılana Dön
          </button>
          <button
            onClick={handleSave}
            type="button"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <CheckCircle2 size={16} /> Ayarları Kaydet
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 size={20} className="text-emerald-600" />
          Arayüz tercihleriniz başarıyla kaydedildi ve tüm programda etkinleştirildi!
        </div>
      )}

      {/* CANLI ÖNİZLEME KUTUSU (INTERACTIVE PREVIEW) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Eye size={16} className="text-indigo-600" /> Canlı Önizleme (Seçimleriniz anında burada görünür)
          </span>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Aktif Tema: {THEMES.find(t => t.id === preferences.theme)?.name}
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">OtelPro Stok & Satış Yönetimi</h3>
              <p className="text-xs text-slate-500 font-medium">Bu metin seçili font ({FONTS.find(f => f.id === preferences.font)?.name}) ve boyut ile biçimlendirilmiştir.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">
                Satışta
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                12 Adet Stok
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <input 
              type="text" 
              placeholder="Örnek Metin Girişi..." 
              defaultValue="Espresso Kahve 100gr"
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
            />
            <button 
              type="button" 
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} /> Birincil Düğme
            </button>
            <button 
              type="button" 
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
            >
              İkincil Düğme
            </button>
          </div>
        </div>
      </div>

      {/* 1. GRUP: RENK TEMASI (THEMES) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-5">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
            <Palette size={20} className="text-indigo-600" />
            1. Renk Teması
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Programın birincil vurgu rengini ve ambiyansını belirleyin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {THEMES.map((theme) => {
            const isSelected = preferences.theme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleUpdate({ theme: theme.id })}
                type="button"
                className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full ${theme.bg} shadow-md flex items-center justify-center text-white`}>
                      {isSelected && <Check size={16} strokeWidth={3} />}
                    </span>
                    <span className="font-bold text-sm text-slate-800">{theme.name}</span>
                  </div>
                  {theme.id === 'dark' ? <Moon size={16} className="text-slate-500" /> : <Sun size={16} className="text-amber-500" />}
                </div>
                <p className="text-xs text-slate-500 leading-snug">{theme.desc}</p>
                <div className="pt-2 flex items-center gap-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${theme.previewBadge}`}>
                    ÖRNEK ROZET
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. GRUP: YAZI TİPLERİ (FONTS & SCALE) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
            <Type size={20} className="text-indigo-600" />
            2. Yazı Fontları ve Boyut
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tüm arayüzde kullanılacak yazı karakterini ve genel metin ölçeğini seçin.
          </p>
        </div>

        {/* Font Families */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FONTS.map((font) => {
            const isSelected = preferences.font === font.id;
            return (
              <button
                key={font.id}
                onClick={() => handleUpdate({ font: font.id })}
                type="button"
                className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-800">{font.name}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className={`text-sm font-bold text-slate-800 ${font.style}`}>
                    {font.sample}
                  </p>
                </div>
                <p className="text-xs text-slate-400 font-medium">{font.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Font Boyut Ölçeği */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-sm text-slate-800">Genel Yazı Boyutu Ölçeği</h4>
            <p className="text-xs text-slate-500">Ekran çözünürlüğünüze göre tüm metinleri büyütün veya küçültün.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
            {[
              { id: 'compact', label: 'Kompakt (%92)' },
              { id: 'normal', label: 'Standart (%100)' },
              { id: 'large', label: 'Büyük / Rahat (%108)' },
            ].map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => handleUpdate({ fontSize: size.id as any })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  preferences.fontSize === size.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. GRUP: ARAYÜZ ŞEKİLLERİ VE KÖŞE HATLARI (SHAPES & RADIUS) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2.5">
            <Sliders size={20} className="text-indigo-600" />
            3. Arayüz Şekilleri & Köşe Hatları
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kartların, butonların ve giriş kutularının köşe kıvrımlarını ve tasarım geometrisini belirleyin.
          </p>
        </div>

        {/* Köşe Hatları (Border Radius) */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
            Köşe Yuvarlaklığı (Border Radius)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RADII.map((radius) => {
              const isSelected = preferences.radius === radius.id;
              return (
                <button
                  key={radius.id}
                  type="button"
                  onClick={() => handleUpdate({ radius: radius.id })}
                  className={`p-4 border-2 text-left transition-all rounded-2xl flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{radius.name}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {/* Görsel Şekil Temsili */}
                  <div className="h-12 bg-slate-100 flex items-center justify-center p-2 rounded-xl">
                    <div className={`w-full h-8 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs ${radius.sampleClass}`}>
                      Örnek Düğme
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-medium">{radius.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kart & Panel Tasarım Stili */}
        <div className="pt-4 border-t border-slate-100">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">
            Kart & Panel Görünümü
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CARD_STYLES.map((card) => {
              const isSelected = preferences.cardStyle === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleUpdate({ cardStyle: card.id })}
                  className={`p-4 border-2 text-left transition-all rounded-2xl flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">{card.name}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className={`p-3 bg-white rounded-xl text-center ${card.preview}`}>
                    <span className="text-[11px] font-bold text-slate-700">Kart Görünümü</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{card.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Arayüz Yoğunluğu & Animasyonlar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
              Arayüz Yoğunluğu (Density)
            </label>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
              {[
                { id: 'compact', label: 'Kompakt (Dar)' },
                { id: 'normal', label: 'Dengeli (Standart)' },
                { id: 'spacious', label: 'Geniş (Ferah)' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleUpdate({ density: d.id as any })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                    preferences.density === d.id
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Kompakt mod, POS ve yoğun stok tablolarında daha fazla veri görmenizi sağlar.</p>
          </div>

          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
              Akıcı Animasyonlar & Geçişler
            </label>
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Sayfa ve Buton Animasyonları</span>
                <span className="text-[11px] text-slate-400">Düşük donanımlı cihazlarda kapatarak hız kazandırabilirsiniz.</span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ enableAnimations: !preferences.enableAnimations })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  preferences.enableAnimations ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    preferences.enableAnimations ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
