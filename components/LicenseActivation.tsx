
import React, { useState, useEffect } from 'react';
import { verifyLicenseKey, generateLicenseKey } from '../services/licenseService';
import { Lock, Copy, CheckCircle, Sparkles, Play } from 'lucide-react';

interface LicenseActivationProps {
  onSuccess: (key: string, machineId: string) => void;
}

export const LicenseActivation: React.FC<LicenseActivationProps> = ({ onSuccess }) => {
  const [machineId, setMachineId] = useState<string>("Yükleniyor...");
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.ipcRenderer) {
      window.ipcRenderer.invoke('get-machine-id')
        .then((id) => setMachineId(id))
        .catch(() => setMachineId("DEMO-ID"));
    } else {
      const demoId = "WEB-DEMO-" + Math.floor(1000 + Math.random() * 9000);
      setMachineId(demoId);
      // Web önizlemede otomatik geçerli anahtarı hazırla
      const autoKey = generateLicenseKey(demoId, 365);
      setInputKey(autoKey);
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(machineId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickDemoActivate = () => {
    const key = inputKey || generateLicenseKey(machineId, 365);
    onSuccess(key, machineId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);
    setTimeout(() => {
      const result = verifyLicenseKey(machineId, inputKey);
      if (result.isValid && !result.isExpired) {
        onSuccess(inputKey, machineId);
      } else {
        setError("Geçersiz lisans anahtarı!");
        setIsVerifying(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <Lock size={32} className="mx-auto mb-2" />
          <h1 className="text-xl font-bold">Lisans Aktivasyonu</h1>
          <p className="text-indigo-200 text-xs mt-1">OtelPro Otel & Stok Yönetim Sistemi</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Makine / Cihaz Kimliği</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-slate-200 p-3 rounded-lg font-mono text-slate-800 font-bold text-center">
                {machineId}
              </code>
              <button onClick={handleCopy} className="bg-slate-200 hover:bg-slate-300 p-3 rounded-lg text-slate-600 transition-colors" title="Kopyala">
                {copied ? <CheckCircle size={20} className="text-green-600"/> : <Copy size={20}/>}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-1">
              <Sparkles size={18} className="text-indigo-600" />
              <span>Hızlı Önizleme Modu</span>
            </div>
            <p className="text-xs text-indigo-700 mb-3">
              Önizleme ve deneme için tek tıkla lisansı aktifleştirip uygulamayı hemen kullanabilirsiniz.
            </p>
            <button
              type="button"
              onClick={handleQuickDemoActivate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow transition-all active:scale-95"
            >
              <Play size={16} />
              Önizleme / Demo Lisansı ile Başlat
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Lisans Anahtarı</label>
              <input 
                type="text" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="LIS-XXXX-XXXX"
                className="w-full border-2 border-slate-300 rounded-xl p-3 bg-white text-slate-900 font-black text-center uppercase outline-none focus:border-indigo-500"
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg font-bold text-center border border-red-200">{error}</div>}
            <button type="submit" disabled={isVerifying} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all">
              {isVerifying ? 'Doğrulanıyor...' : 'Manuel Anahtar ile Aktif Et'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};