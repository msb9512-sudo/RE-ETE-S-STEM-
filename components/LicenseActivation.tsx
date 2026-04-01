
import React, { useState, useEffect } from 'react';
import { verifyLicenseKey } from '../services/licenseService';
import { Lock, Copy, CheckCircle } from 'lucide-react';

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
      setMachineId("WEB-DEMO-" + Math.floor(Math.random() * 10000));
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(machineId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-red-600 p-6 text-white text-center">
          <Lock size={32} className="mx-auto mb-2" />
          <h1 className="text-xl font-bold">Lisans Aktivasyonu</h1>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border">
            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Makine Kimliği</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border p-3 rounded-lg font-mono text-slate-800 font-bold text-center">
                {machineId}
              </code>
              <button onClick={handleCopy} className="bg-slate-200 p-3 rounded-lg text-slate-600">
                {copied ? <CheckCircle size={20} className="text-green-600"/> : <Copy size={20}/>}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Lisans Anahtarı</label>
              <input 
                type="text" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="LIS-XXXX-XXXX"
                className="w-full border-2 border-slate-300 rounded-xl p-3 bg-white text-slate-900 font-black text-center uppercase outline-none focus:border-red-500"
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg font-bold text-center">{error}</div>}
            <button type="submit" disabled={isVerifying} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {isVerifying ? 'Doğrulanıyor...' : 'Sistemi Aktif Et'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};