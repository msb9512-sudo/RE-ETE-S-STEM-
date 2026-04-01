
import React, { useState } from 'react';
import { Code2, Key, Copy, CheckCircle, CalendarClock, Settings2, Clock } from 'lucide-react';

// Removed the non-existent import from licenseService as the key generation logic is implemented locally in this component
export const Producer: React.FC = () => {
  const [clientMachineId, setClientMachineId] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [customVal, setCustomVal] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<'min' | 'hour' | 'day' | 'month'>('month');
  const [selectedQuick, setSelectedQuick] = useState<string>("month-12");
  const [copied, setCopied] = useState(false);
  
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientMachineId) return;
    
    let unit: string, val: number;

    if (isCustom) {
      unit = customUnit;
      val = customVal;
    } else if (selectedQuick === 'forever') {
      unit = 'forever';
      val = -1;
    } else {
      const parts = selectedQuick.split('-');
      unit = parts[0];
      val = parseInt(parts[1]);
    }

    // Hash logic and timestamp generation
    const SECRET_SALT = "OTELPRO_ENTERPRISE_2024_SECRET_KEY";
    const generateHash = (input: string): string => {
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).toUpperCase();
    };

    const expiryDate = new Date();
    if (unit === 'min') expiryDate.setMinutes(expiryDate.getMinutes() + val);
    else if (unit === 'hour') expiryDate.setHours(expiryDate.getHours() + val);
    else if (unit === 'day') expiryDate.setDate(expiryDate.getDate() + val);
    else if (unit === 'month') expiryDate.setMonth(expiryDate.getMonth() + val);
    else if (unit === 'forever') expiryDate.setFullYear(expiryDate.getFullYear() + 100);

    const timestamp = expiryDate.getTime();
    const hexExpiry = timestamp.toString(16).toUpperCase();
    const signatureRaw = generateHash(clientMachineId + hexExpiry + SECRET_SALT);
    const signature = signatureRaw.substring(0, 8);
    
    setGeneratedKey(`LIS-${hexExpiry}-${signature}`);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickOptions = [
    { label: '1 Saat', value: 'hour-1' },
    { label: '1 Gün', value: 'day-1' },
    { label: '1 Ay', value: 'month-1' },
    { label: '1 Yıl', value: 'month-12' },
    { label: 'Sınırsız', value: 'forever' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in zoom-in duration-500 pb-12">
      <div className="relative group w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-slate-900 rounded-2xl shadow-xl p-8 w-full text-center border border-slate-800">
          
          <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-green-500/50">
            <Key size={40} className="text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Geliştirici Paneli</h2>
          <p className="text-sm text-slate-400 mb-8">Hassas Süreli Lisans Üretimi</p>

          <div className="text-left space-y-4">
            
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <p className="text-slate-400 text-xs mb-2 font-medium">1. Süre Seçin:</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {quickOptions.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => { setSelectedQuick(d.value); setIsCustom(false); }}
                      className={`text-[10px] py-2 rounded border transition-colors ${!isCustom && selectedQuick === d.value ? 'bg-green-600 text-white border-green-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                    >
                      {d.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`text-[10px] py-2 rounded border transition-colors flex items-center justify-center gap-1 ${isCustom ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                  >
                    <Settings2 size={12} /> Özel
                  </button>
                </div>

                {isCustom && (
                  <div className="mb-4 p-3 bg-slate-950 rounded-lg border border-indigo-900/30 animate-in slide-in-from-top-1">
                    <div className="flex gap-2">
                       <div className="flex-1">
                          <label className="text-[10px] text-indigo-400 font-bold uppercase ml-1">Miktar</label>
                          <input 
                            type="number"
                            min="1"
                            value={customVal}
                            onChange={(e) => setCustomVal(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-500"
                          />
                       </div>
                       <div className="flex-1">
                          <label className="text-[10px] text-indigo-400 font-bold uppercase ml-1">Birim</label>
                          <select 
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-xs mt-1 outline-none focus:border-indigo-500"
                          >
                            <option value="min">Dakika</option>
                            <option value="hour">Saat</option>
                            <option value="day">Gün</option>
                            <option value="month">Ay</option>
                          </select>
                       </div>
                    </div>
                  </div>
                )}

                <p className="text-slate-400 text-xs mb-2 font-medium">2. Müşteri Makine ID:</p>
                <form onSubmit={handleGenerate} className="space-y-3">
                  <input 
                    type="text" 
                    value={clientMachineId}
                    onChange={(e) => setClientMachineId(e.target.value)}
                    placeholder="Örn: 5BDE-DE3B-..."
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-green-500 outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!clientMachineId}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CalendarClock size={14} /> Lisans Anahtarı Üret
                  </button>
                </form>

                {generatedKey && (
                  <div className="mt-4 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-top-2">
                     <p className="text-green-400 text-[10px] mb-1 font-bold flex items-center gap-1">
                       <Clock size={10}/> Lisans Hazır:
                     </p>
                     <div className="flex items-center gap-2">
                       <code className="flex-1 bg-black/50 p-2 rounded text-green-300 font-mono text-[11px] border border-green-900/50 break-all leading-tight">
                         {generatedKey}
                       </code>
                       <button 
                         onClick={handleCopy}
                         className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
                       >
                         {copied ? <CheckCircle size={18} className="text-green-500"/> : <Copy size={18}/>}
                       </button>
                     </div>
                  </div>
                )}
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
               <div className="flex items-center gap-3">
                 <div className="bg-purple-500/10 p-2 rounded-lg"><Code2 className="text-purple-400" size={16}/></div>
                 <div>
                   <p className="text-white text-xs font-bold">OtelPro Admin Tool</p>
                   <p className="text-slate-500 text-[10px]">v2.5 Precise Edition</p>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
