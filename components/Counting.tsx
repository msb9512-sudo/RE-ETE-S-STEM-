
import React, { useState } from 'react';
import { InventoryItem, CountSession, CountItem, Category, Unit } from '../types';
import { ClipboardCheck, Save, AlertCircle, CheckCircle, Calculator, ShieldAlert } from 'lucide-react';

interface CountingProps {
  inventory: InventoryItem[];
  onSaveCount: (session: CountSession) => void;
  isReadonly?: boolean;
}

export const Counting: React.FC<CountingProps> = ({ inventory, onSaveCount, isReadonly = false }) => {
  const [sessionType, setSessionType] = useState<'MONTHLY' | 'SPOT_CHECK'>('SPOT_CHECK');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isReviewing, setIsReviewing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const handleCountChange = (id: string, val: string) => {
    if (isReadonly) return;
    setCounts(prev => ({...prev, [id]: parseFloat(val) || 0}));
  };

  const handleFinish = () => {
    if (isReadonly) return;
    const items = Object.entries(counts).map(([id, countedQty]) => {
      const item = inventory.find(i => i.id === id);
      const variance = (countedQty as number) - (item?.quantity || 0);
      return item ? { inventoryItemId: id, systemQuantity: item.quantity, countedQuantity: countedQty as number, variance, varianceCost: variance * item.costPerUnit } : null;
    }).filter(Boolean) as CountItem[];
    onSaveCount({ id: Date.now().toString(), date: Date.now(), type: sessionType, items, status: 'COMPLETED', performedBy: 'Admin' });
    setCounts({});
    setIsReviewing(false);
  };

  if (isReviewing) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="text-blue-600" /> Sayım Onayı</h2>
        <div className="bg-white p-6 rounded-xl shadow border">
           <div className="flex justify-between items-center mb-6">
             <span className="text-slate-500">Analiz tamamlandı.</span>
             <div className="flex gap-3">
               <button onClick={() => setIsReviewing(false)} className="px-4 py-2 border rounded-lg">Geri</button>
               <button onClick={handleFinish} disabled={isReadonly} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50">Onayla</button>
             </div>
           </div>
           {isReadonly && <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 mb-4"><ShieldAlert size={18}/> Lisans dolduğu için sayım kaydedilemez.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div><h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="text-blue-600" /> Sayım</h2></div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border">
          <button onClick={() => setSessionType('SPOT_CHECK')} className={`px-3 py-1.5 text-sm rounded ${sessionType === 'SPOT_CHECK' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>Spot</button>
          <button onClick={() => setSessionType('MONTHLY')} className={`px-3 py-1.5 text-sm rounded ${sessionType === 'MONTHLY' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>Genel</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="p-4">Ürün</th><th className="p-4">Sistem</th><th className="p-4">Sayılan</th></tr>
          </thead>
          <tbody className="divide-y">
            {[...inventory]
              .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
              .map(item => (
              <tr key={item.id}>
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4">{item.quantity}</td>
                <td className="p-4"><input type="number" step="0.01" disabled={isReadonly} className="border rounded p-1 w-24 disabled:bg-slate-100" onChange={(e) => handleCountChange(item.id, e.target.value)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="fixed bottom-6 right-6">
        <button onClick={() => setIsReviewing(true)} disabled={isReadonly || Object.keys(counts).length === 0} className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold disabled:opacity-50"><Calculator size={20} /> Analiz Et</button>
      </div>
    </div>
  );
};
