
import React, { useEffect, useState } from 'react';
import { InventoryItem, Sale, Log } from '../types';
import { analyzeStockAction } from '../services/geminiService';
import { 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  DollarSign, 
  BrainCircuit,
  Loader2,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface DashboardProps {
  inventory: InventoryItem[];
  sales: Sale[];
  logs: Log[];
  recipes: Recipe[];
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, sales, logs, recipes }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  const lowStockItems = inventory.filter(i => i.quantity <= i.minLevel);
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
  const totalStockValue = inventory.reduce((acc, item) => acc + (item.quantity * item.costPerUnit), 0);
  
  const salesData = sales.slice(-15).map((s, index) => ({
    name: index + 1,
    tutar: s.totalPrice
  }));

  const handleAiAnalysis = async () => {
    setAnalyzing(true);
    const inventorySummary = inventory.map(i => `${i.name}: ${i.quantity} ${i.unit} (Min: ${i.minLevel})`).join("\n");
    const result = await analyzeStockAction(inventorySummary);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">İşletme Paneli</h2>
          <p className="text-slate-500 font-medium">Hoş geldiniz, işletmenizin son durumu burada.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Canlı İzleme</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><TrendingUp size={64}/></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Toplam Ciro</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">₺{totalRevenue.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-1 text-green-600 text-[10px] font-black uppercase">
            <span>Sürekli Artış</span>
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><AlertTriangle size={64}/></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Kritik Stok</p>
          <h3 className={`text-3xl font-black tracking-tight ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {lowStockItems.length} Ürün
          </h3>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase">
            <span className={lowStockItems.length > 0 ? 'text-red-500' : 'text-green-500'}>
              {lowStockItems.length > 0 ? 'ACİL EYLEM GEREKLİ' : 'DEPO DURUMU İYİ'}
            </span>
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><DollarSign size={64}/></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Depo Değeri</p>
          <h3 className="text-3xl font-black text-indigo-600 tracking-tight">₺{totalStockValue.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-1 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
            <span>Bağlı Sermaye</span>
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><Package size={64}/></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Toplam Ürün</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{inventory.length} Çeşit</h3>
          <div className="mt-4 flex items-center gap-1 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
            <span>Aktif Katalog</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Activity size={20}/></div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase tracking-widest text-sm">Son Satış Trendi</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}`} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} />
                <Area type="monotone" dataKey="tutar" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#chartGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-black text-white flex items-center gap-3 uppercase tracking-widest text-sm">
              <div className="bg-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <BrainCircuit size={20} />
              </div>
              Yapay Zeka
            </h3>
            <button 
              onClick={handleAiAnalysis}
              disabled={analyzing}
              className="text-[10px] bg-white hover:bg-indigo-50 text-slate-900 px-4 py-2 rounded-full transition-all font-black uppercase tracking-widest disabled:opacity-50 active:scale-95"
            >
              {analyzing ? <Loader2 size={12} className="animate-spin" /> : 'Tıkla & Analiz Et'}
            </button>
          </div>
          <div className="flex-1 bg-white/5 backdrop-blur-md rounded-3xl p-6 text-sm text-indigo-100 overflow-y-auto max-h-[300px] leading-relaxed relative z-10 custom-scrollbar whitespace-pre-line font-medium italic">
            {aiAnalysis ? aiAnalysis : "Depo durumunuzu analiz etmek, kritik ürünleri tespit etmek ve satın alma tavsiyeleri almak için yukarıdaki butona tıklayın."}
          </div>
        </div>
      </div>

      {/* Critical Stock List & Latest Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black mb-6 text-slate-800 tracking-tighter uppercase tracking-widest text-sm">Kritik Stok Uyarıları</h3>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-10 bg-green-50 rounded-3xl">
               <p className="text-green-600 font-black uppercase tracking-widest text-xs">Mükemmel! Tüm stok seviyeleri güvenli.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Ürün Adı</th>
                    <th className="px-6 py-4 text-center">Mevcut</th>
                    <th className="px-6 py-4 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map(item => (
                    <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-black text-slate-800 text-base">{item.name}</td>
                      <td className="px-6 py-5 text-center font-black text-red-600 text-lg tracking-tight">{item.quantity} {item.unit}</td>
                      <td className="px-6 py-5 text-right">
                        <span className="inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-600 uppercase tracking-widest animate-pulse">
                          KRİTİK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black mb-6 text-slate-800 tracking-tighter uppercase tracking-widest text-sm">Son Aktiviteler</h3>
          <div className="space-y-4">
            {sales.length === 0 && logs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-3xl">
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Henüz bir aktivite bulunmuyor.</p>
              </div>
            ) : (
              <>
                {[...sales].reverse().slice(0, 3).map(sale => {
                  const recipe = recipes.find(r => r.id === sale.recipeId);
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 text-green-600 p-2 rounded-xl">
                          <TrendingUp size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{recipe?.name || 'Bilinmeyen Ürün'} Satışı</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date(sale.timestamp).toLocaleTimeString('tr-TR')} • {sale.staffName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-600">+₺{sale.totalPrice.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sale.quantity} Adet</p>
                      </div>
                    </div>
                  );
                })}
                {[...logs].reverse().slice(0, 3).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${
                        log.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                        log.type === 'error' ? 'bg-red-100 text-red-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <Activity size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{log.message}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
