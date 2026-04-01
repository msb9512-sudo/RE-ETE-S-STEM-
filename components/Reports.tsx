
import React from 'react';
import { CountSession, StockMovement, StockMovementType, InventoryItem, Sale, Recipe } from '../types';
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  FileBarChart, 
  DollarSign, 
  ClipboardCheck, 
  Package, 
  Percent,
  ArrowRightLeft,
  PieChart as PieIcon,
  Layers,
  Activity,
  Award,
  Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface ReportsProps {
  countSessions: CountSession[];
  movements: StockMovement[];
  inventory: InventoryItem[];
  sales: Sale[];
  recipes: Recipe[];
}

export const Reports: React.FC<ReportsProps> = ({ countSessions, movements, inventory, sales, recipes }) => {
  const hasData = sales.length > 0 || movements.length > 0 || countSessions.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in p-12">
        <div className="relative">
          <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative bg-white p-10 rounded-full shadow-2xl border border-slate-100">
            <FileBarChart size={100} className="text-indigo-200" />
          </div>
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Veri Analizi Bekleniyor</h2>
        <p className="text-slate-500 max-w-md mx-auto mt-4 text-lg font-medium">
          Raporlarınızın oluşması için en az bir satış veya sayım kaydı gereklidir.
        </p>
      </div>
    );
  }

  // --- Hesaplamalar ---
  // Fix: Explicitly cast totalPrice to number to ensure numeric addition in reduce.
  const totalRevenue = sales.reduce((acc: number, s) => acc + (Number(s.totalPrice) || 0), 0);
  // Fix: Explicitly cast inventory quantity and costPerUnit to numbers for safe arithmetic.
  const totalStockValue = inventory.reduce((acc: number, item) => acc + (Number(item.quantity || 0) * Number(item.costPerUnit || 0)), 0);
  
  // Reçete Maliyetleri üzerinden Brüt Kâr Tahmini
  // Fix: Ensure cost and quantity operands are explicitly numbers during reduction.
  const totalCostOfSales = sales.reduce((acc: number, sale) => {
    const recipe = recipes.find(r => r.id === sale.recipeId);
    if (!recipe) return acc;
    const cost = recipe.ingredients.reduce((cAcc: number, ing) => {
      const item = inventory.find(i => i.id === ing.inventoryItemId);
      return cAcc + (Number(ing.amount) * (Number(item?.costPerUnit) || 0));
    }, 0);
    return acc + (cost * Number(sale.quantity));
  }, 0);

  const grossProfit = totalRevenue - totalCostOfSales;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Sayım Farkı Analizi
  // Fix: Ensure varianceCost is treated as a number in the reduction.
  const totalVarianceCost = countSessions.reduce((acc: number, session) => {
    const sessionVariance = session.items.reduce((sAcc: number, item) => sAcc + (Number(item.varianceCost) || 0), 0);
    return acc + sessionVariance;
  }, 0);

  // En Çok Satan 5 Ürün
  // Fix: Guarantee numeric addition for sales trend tracking.
  const salesByRecipe = sales.reduce((acc: Record<string, number>, s) => {
    const name = recipes.find(r => r.id === s.recipeId)?.name || 'Bilinmeyen';
    const currentQty: number = Number(acc[name] || 0);
    acc[name] = currentQty + Number(s.quantity);
    return acc;
  }, {} as Record<string, number>);

  // Fix: Explicitly treat values as numbers in sort logic to avoid arithmetic type errors.
  const topProductsData = Object.entries(salesByRecipe)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Kategori Dağılımı
  // Fix: Ensure numeric types for all operands in the arithmetic operation on line 99 (prevValue, currentQtyVal, currentCost).
  const categoryValues = inventory.reduce((acc: Record<string, number>, item: InventoryItem) => {
    const currentQtyVal = Number(item.quantity || 0);
    const currentCost = Number(item.costPerUnit || 0);
    const prevValue = Number(acc[item.category] || 0);
    acc[item.category] = prevValue + (currentQtyVal * currentCost);
    return acc;
  }, {} as Record<string, number>);
  const categoryChartData = Object.entries(categoryValues).map(([name, value]) => ({ name, value }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e'];

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-200">
              <Activity size={32} />
            </div>
            Yönetim Analitiği
          </h2>
          <p className="text-slate-500 font-semibold mt-1">İşletmenizin finansal röntgeni ve depo sağlığı.</p>
        </div>
      </div>

      {/* Üst KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Toplam Ciro</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">₺{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-green-600 font-bold mt-2">SATIŞ HACMİ</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Brüt Kâr (Tahmini)</p>
            <p className="text-4xl font-black text-indigo-600 tracking-tight">₺{grossProfit.toLocaleString()}</p>
            <p className={`text-[10px] font-bold mt-2 ${profitMargin > 40 ? 'text-green-600' : 'text-amber-600'}`}>
              %{profitMargin.toFixed(1)} MARJ
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-50 rounded-full group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sayım Kaybı</p>
            <p className={`text-4xl font-black tracking-tight ${totalVarianceCost < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              ₺{Math.abs(totalVarianceCost).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-2">SİSTEM VS FİZİKSEL</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Stok Değeri</p>
            <p className="text-4xl font-black text-slate-800 tracking-tight">₺{totalStockValue.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-2">{inventory.length} ÇEŞİT ÜRÜN</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* En Çok Satanlar */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-2xl mb-8 flex items-center gap-3">
            <Award className="text-amber-500" /> Popüler Ürünler
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stok Kategori Dağılımı */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-2xl mb-8 flex items-center gap-3">
            <PieIcon className="text-indigo-500" /> Stok Maliyet Dağılımı
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  innerRadius={80} outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `₺${v.toLocaleString()}`} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kritik Durum Özeti */}
      <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><AlertTriangle size={150} /></div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-3xl font-black mb-4">Operasyonel Kritikler</h3>
            <p className="text-indigo-200 font-medium mb-8">Hemen aksiyon alınması gereken kalemler:</p>
            <div className="space-y-4">
              {inventory.filter(i => (i.quantity || 0) <= (i.minLevel || 0)).slice(0, 4).map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-red-400 font-black">{item.quantity} {item.unit} Kaldı</span>
                </div>
              ))}
              {inventory.filter(i => (i.quantity || 0) <= (i.minLevel || 0)).length === 0 && (
                <p className="text-green-400 font-bold italic">Tüm stoklar güvenli seviyede.</p>
              )}
            </div>
          </div>
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
            <h4 className="font-black text-xl mb-4 flex items-center gap-2 text-indigo-400">
              <TrendingDown size={20}/> Kayıp Analizi
            </h4>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <span className="text-slate-400 text-sm">Son Sayım Açığı</span>
                <span className="text-2xl font-black text-red-500">₺{Math.abs(totalVarianceCost).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                * Bu tutar, son sayımlarda sistem ile fiziksel depo arasındaki farktan kaynaklanan maliyet kaybını temsil eder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
