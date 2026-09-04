import React, { useState, useEffect } from 'react';
import { InventoryItem, Sale, Log, Recipe } from '../types';
import { 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Activity,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  GripVertical,
  LayoutDashboard
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  inventory: InventoryItem[];
  sales: Sale[];
  logs: Log[];
  recipes: Recipe[];
}

type SectionId = 'stats' | 'chart' | 'critical_list' | 'activities';
type StatId = 'revenue' | 'critical' | 'value' | 'inventory';

interface DashboardLayoutState {
  sectionOrder: SectionId[];
  sectionVisible: Record<SectionId, boolean>;
  sectionCollapsed: Record<SectionId, boolean>;
  statOrder: StatId[];
  statVisible: Record<StatId, boolean>;
  statCollapsed: Record<StatId, boolean>;
}

const STORAGE_KEY = 'otelpro_dashboard_layout_v1';

const DEFAULT_LAYOUT: DashboardLayoutState = {
  sectionOrder: ['stats', 'chart', 'critical_list', 'activities'],
  sectionVisible: {
    stats: true,
    chart: true,
    critical_list: true,
    activities: true,
  },
  sectionCollapsed: {
    stats: false,
    chart: false,
    critical_list: false,
    activities: false,
  },
  statOrder: ['revenue', 'critical', 'value', 'inventory'],
  statVisible: {
    revenue: true,
    critical: true,
    value: true,
    inventory: true,
  },
  statCollapsed: {
    revenue: false,
    critical: false,
    value: false,
    inventory: false,
  },
};

export const Dashboard: React.FC<DashboardProps> = ({ inventory, sales, logs, recipes }) => {
  const [layout, setLayout] = useState<DashboardLayoutState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          sectionOrder: Array.isArray(parsed.sectionOrder) ? parsed.sectionOrder : DEFAULT_LAYOUT.sectionOrder,
          sectionVisible: { ...DEFAULT_LAYOUT.sectionVisible, ...(parsed.sectionVisible || {}) },
          sectionCollapsed: { ...DEFAULT_LAYOUT.sectionCollapsed, ...(parsed.sectionCollapsed || {}) },
          statOrder: Array.isArray(parsed.statOrder) ? parsed.statOrder : DEFAULT_LAYOUT.statOrder,
          statVisible: { ...DEFAULT_LAYOUT.statVisible, ...(parsed.statVisible || {}) },
          statCollapsed: { ...DEFAULT_LAYOUT.statCollapsed, ...(parsed.statCollapsed || {}) },
        };
      }
    } catch (e) {
      console.error('Error loading dashboard layout:', e);
    }
    return DEFAULT_LAYOUT;
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [draggedSection, setDraggedSection] = useState<SectionId | null>(null);
  const [draggedStat, setDraggedStat] = useState<StatId | null>(null);

  // Veri değişikliklerini kaydet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.error('Error saving dashboard layout:', e);
    }
  }, [layout]);

  const lowStockItems = inventory.filter(i => i.quantity <= i.minLevel);
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
  const totalStockValue = inventory.reduce((acc, item) => acc + (item.quantity * item.costPerUnit), 0);
  
  const salesData = sales.slice(-15).map((s, index) => ({
    name: index + 1,
    tutar: s.totalPrice
  }));

  // Reorder & toggle yardımcı fonksiyonları
  const moveSection = (id: SectionId, direction: 'up' | 'down') => {
    setLayout(prev => {
      const idx = prev.sectionOrder.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.sectionOrder.length) return prev;
      const newOrder = [...prev.sectionOrder];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      return { ...prev, sectionOrder: newOrder };
    });
  };

  const moveStat = (id: StatId, direction: 'left' | 'right') => {
    setLayout(prev => {
      const idx = prev.statOrder.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.statOrder.length) return prev;
      const newOrder = [...prev.statOrder];
      const temp = newOrder[idx];
      newOrder[idx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      return { ...prev, statOrder: newOrder };
    });
  };

  const toggleSectionVisibility = (id: SectionId) => {
    setLayout(prev => ({
      ...prev,
      sectionVisible: {
        ...prev.sectionVisible,
        [id]: !prev.sectionVisible[id],
      }
    }));
  };

  const toggleSectionCollapse = (id: SectionId) => {
    setLayout(prev => ({
      ...prev,
      sectionCollapsed: {
        ...prev.sectionCollapsed,
        [id]: !prev.sectionCollapsed[id],
      }
    }));
  };

  const toggleStatVisibility = (id: StatId) => {
    setLayout(prev => ({
      ...prev,
      statVisible: {
        ...prev.statVisible,
        [id]: !prev.statVisible[id],
      }
    }));
  };

  const toggleStatCollapse = (id: StatId) => {
    setLayout(prev => ({
      ...prev,
      statCollapsed: {
        ...prev.statCollapsed,
        [id]: !prev.statCollapsed[id],
      }
    }));
  };

  const resetToDefault = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  const showAllWidgets = () => {
    setLayout(prev => ({
      ...prev,
      sectionVisible: {
        stats: true,
        chart: true,
        critical_list: true,
        activities: true,
      },
      statVisible: {
        revenue: true,
        critical: true,
        value: true,
        inventory: true,
      }
    }));
  };

  // İstatistik kutucukları tanımları
  const statDefinitions: Record<StatId, { title: string; subtitle: string; value: string; icon: React.ReactNode; color: string; subColor: string }> = {
    revenue: {
      title: 'Toplam Ciro',
      subtitle: 'Sürekli Artış',
      value: `₺${totalRevenue.toLocaleString()}`,
      icon: <TrendingUp size={24} />,
      color: 'text-slate-900',
      subColor: 'text-green-600',
    },
    critical: {
      title: 'Kritik Stok',
      subtitle: lowStockItems.length > 0 ? 'ACİL EYLEM GEREKLİ' : 'DEPO DURUMU İYİ',
      value: `${lowStockItems.length} Ürün`,
      icon: <AlertTriangle size={24} />,
      color: lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-800',
      subColor: lowStockItems.length > 0 ? 'text-red-500' : 'text-green-500',
    },
    value: {
      title: 'Depo Değeri',
      subtitle: 'Bağlı Sermaye',
      value: `₺${totalStockValue.toLocaleString()}`,
      icon: <DollarSign size={24} />,
      color: 'text-indigo-600',
      subColor: 'text-slate-500',
    },
    inventory: {
      title: 'Toplam Ürün',
      subtitle: 'Aktif Katalog',
      value: `${inventory.length} Çeşit`,
      icon: <Package size={24} />,
      color: 'text-slate-800',
      subColor: 'text-slate-500',
    },
  };

  const sectionTitles: Record<SectionId, string> = {
    stats: 'Özet İstatistik Kartları',
    chart: 'Son Satış Trendi Grafiği',
    critical_list: 'Kritik Stok Uyarıları Tablosu',
    activities: 'Son Aktiviteler Akışı',
  };

  // Gizli kutucuk sayısı hesabı
  const hiddenStatsCount = layout.statOrder.filter(id => !layout.statVisible[id]).length;
  const hiddenSectionsCount = layout.sectionOrder.filter(id => !layout.sectionVisible[id]).length;
  const totalHiddenCount = hiddenStatsCount + hiddenSectionsCount;

  // Stat kartı render etme
  const renderStatCard = (id: StatId, index: number, totalInRow: number) => {
    if (!layout.statVisible[id]) return null;
    const def = statDefinitions[id];
    const isCollapsed = layout.statCollapsed[id];

    return (
      <div 
        key={id}
        draggable={isEditMode}
        onDragStart={() => setDraggedStat(id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggedStat && draggedStat !== id) {
            const oldIdx = layout.statOrder.indexOf(draggedStat);
            const newIdx = layout.statOrder.indexOf(id);
            if (oldIdx !== -1 && newIdx !== -1) {
              const newOrder = [...layout.statOrder];
              newOrder.splice(oldIdx, 1);
              newOrder.splice(newIdx, 0, draggedStat);
              setLayout(prev => ({ ...prev, statOrder: newOrder }));
            }
          }
          setDraggedStat(null);
        }}
        className={`bg-white rounded-[2rem] shadow-sm border transition-all duration-200 relative group overflow-hidden ${
          isEditMode ? 'border-dashed border-indigo-400 ring-2 ring-indigo-100 cursor-move' : 'border-slate-100'
        } ${isCollapsed ? 'p-5' : 'p-7'}`}
      >
        {/* Kontrol Butonları */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {isEditMode && <GripVertical size={16} className="text-indigo-400 cursor-grab" />}
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{def.title}</span>
          </div>

          <div className="flex items-center gap-1">
            {isEditMode && (
              <>
                <button 
                  onClick={() => moveStat(id, 'left')} 
                  disabled={index === 0}
                  title="Sola Taşı"
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-25 transition-colors"
                >
                  <ArrowLeft size={14} />
                </button>
                <button 
                  onClick={() => moveStat(id, 'right')} 
                  disabled={index === totalInRow - 1}
                  title="Sağa Taşı"
                  className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-25 transition-colors"
                >
                  <ArrowRight size={14} />
                </button>
                <button 
                  onClick={() => toggleStatVisibility(id)} 
                  title="Kutuyu Gizle"
                  className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <EyeOff size={14} />
                </button>
              </>
            )}
            <button 
              onClick={() => toggleStatCollapse(id)} 
              title={isCollapsed ? 'Genişlet (Aç)' : 'Daralt (Kapat)'}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* İçerik */}
        {isCollapsed ? (
          <div className="flex items-center justify-between pt-1">
            <h3 className={`text-xl font-black tracking-tight ${def.color}`}>{def.value}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{def.subtitle}</span>
          </div>
        ) : (
          <>
            <div className="absolute top-2 right-2 p-4 opacity-10 pointer-events-none group-hover:scale-125 transition-transform">
              {def.icon}
            </div>
            <h3 className={`text-3xl font-black tracking-tight mt-2 ${def.color}`}>{def.value}</h3>
            <div className={`mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${def.subColor}`}>
              <span>{def.subtitle}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  // İstatistikler Bölümü
  const renderStatsSection = (sectionIndex: number) => {
    const visibleStats = layout.statOrder.filter(id => layout.statVisible[id]);
    const isSectionCollapsed = layout.sectionCollapsed.stats;

    if (visibleStats.length === 0) return null;

    const gridColsClass = 
      visibleStats.length === 1 ? 'grid-cols-1' :
      visibleStats.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
      visibleStats.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

    return (
      <div 
        key="stats"
        draggable={isEditMode}
        onDragStart={() => setDraggedSection('stats')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggedSection && draggedSection !== 'stats') {
            const oldIdx = layout.sectionOrder.indexOf(draggedSection);
            const newIdx = layout.sectionOrder.indexOf('stats');
            if (oldIdx !== -1 && newIdx !== -1) {
              const newOrder = [...layout.sectionOrder];
              newOrder.splice(oldIdx, 1);
              newOrder.splice(newIdx, 0, draggedSection);
              setLayout(prev => ({ ...prev, sectionOrder: newOrder }));
            }
          }
          setDraggedSection(null);
        }}
        className={`transition-all ${isEditMode ? 'p-3 rounded-[2.5rem] bg-indigo-50/40 border-2 border-dashed border-indigo-200' : ''}`}
      >
        {isEditMode && (
          <div className="flex items-center justify-between mb-3 px-3 py-1.5 bg-white/80 rounded-xl border border-indigo-100 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <GripVertical size={16} className="text-indigo-400" />
              <span>Metrik Kartları ({visibleStats.length} Açık)</span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => moveSection('stats', 'up')} 
                disabled={sectionIndex === 0}
                title="Bölümü Yukarı Taşı"
                className="p-1 rounded text-slate-500 hover:text-indigo-600 disabled:opacity-20"
              >
                <ArrowUp size={15} />
              </button>
              <button 
                onClick={() => moveSection('stats', 'down')} 
                disabled={sectionIndex === layout.sectionOrder.length - 1}
                title="Bölümü Aşağı Taşı"
                className="p-1 rounded text-slate-500 hover:text-indigo-600 disabled:opacity-20"
              >
                <ArrowDown size={15} />
              </button>
              <button 
                onClick={() => toggleSectionVisibility('stats')}
                title="Bölümü Gizle"
                className="p-1 rounded text-slate-500 hover:text-red-500"
              >
                <EyeOff size={15} />
              </button>
              <button 
                onClick={() => toggleSectionCollapse('stats')}
                title={isSectionCollapsed ? 'Genişlet' : 'Daralt'}
                className="p-1 rounded text-slate-500 hover:text-slate-800"
              >
                {isSectionCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </button>
            </div>
          </div>
        )}

        {!isSectionCollapsed && (
          <div className={`grid ${gridColsClass} gap-6`}>
            {visibleStats.map((statId, idx) => renderStatCard(statId, idx, visibleStats.length))}
          </div>
        )}
      </div>
    );
  };

  // Satış Trendi Grafiği Bölümü
  const renderChartSection = (sectionIndex: number) => {
    const isCollapsed = layout.sectionCollapsed.chart;

    return (
      <div 
        key="chart"
        draggable={isEditMode}
        onDragStart={() => setDraggedSection('chart')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggedSection && draggedSection !== 'chart') {
            const oldIdx = layout.sectionOrder.indexOf(draggedSection);
            const newIdx = layout.sectionOrder.indexOf('chart');
            if (oldIdx !== -1 && newIdx !== -1) {
              const newOrder = [...layout.sectionOrder];
              newOrder.splice(oldIdx, 1);
              newOrder.splice(newIdx, 0, draggedSection);
              setLayout(prev => ({ ...prev, sectionOrder: newOrder }));
            }
          }
          setDraggedSection(null);
        }}
        className={`bg-white rounded-[2.5rem] shadow-sm border transition-all duration-200 ${
          isEditMode ? 'border-dashed border-indigo-400 ring-2 ring-indigo-100 cursor-move' : 'border-slate-100'
        } ${isCollapsed ? 'p-6' : 'p-8'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditMode && <GripVertical size={18} className="text-indigo-400 cursor-grab" />}
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Activity size={20}/></div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight uppercase tracking-wider">Son Satış Trendi</h3>
              {isCollapsed && (
                <p className="text-xs text-slate-400 font-medium">Grafik daraltıldı • {sales.length} toplam işlem</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isEditMode && (
              <>
                <button 
                  onClick={() => moveSection('chart', 'up')} 
                  disabled={sectionIndex === 0}
                  title="Yukarı Taşı"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-25"
                >
                  <ArrowUp size={16} />
                </button>
                <button 
                  onClick={() => moveSection('chart', 'down')} 
                  disabled={sectionIndex === layout.sectionOrder.length - 1}
                  title="Aşağı Taşı"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-25"
                >
                  <ArrowDown size={16} />
                </button>
                <button 
                  onClick={() => toggleSectionVisibility('chart')} 
                  title="Gizle"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                  <EyeOff size={16} />
                </button>
              </>
            )}
            <button 
              onClick={() => toggleSectionCollapse('chart')} 
              title={isCollapsed ? 'Genişlet (Aç)' : 'Daralt (Kapat)'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="h-80 w-full mt-6">
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
        )}
      </div>
    );
  };

  // Kritik Stok veya Son Aktiviteler Kartı
  const renderDetailCard = (id: 'critical_list' | 'activities', sectionIndex: number) => {
    const isCollapsed = layout.sectionCollapsed[id];
    const isCritical = id === 'critical_list';

    return (
      <div 
        key={id}
        draggable={isEditMode}
        onDragStart={() => setDraggedSection(id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (draggedSection && draggedSection !== id) {
            const oldIdx = layout.sectionOrder.indexOf(draggedSection);
            const newIdx = layout.sectionOrder.indexOf(id);
            if (oldIdx !== -1 && newIdx !== -1) {
              const newOrder = [...layout.sectionOrder];
              newOrder.splice(oldIdx, 1);
              newOrder.splice(newIdx, 0, draggedSection);
              setLayout(prev => ({ ...prev, sectionOrder: newOrder }));
            }
          }
          setDraggedSection(null);
        }}
        className={`bg-white rounded-[2.5rem] shadow-sm border transition-all duration-200 flex flex-col ${
          isEditMode ? 'border-dashed border-indigo-400 ring-2 ring-indigo-100 cursor-move' : 'border-slate-100'
        } ${isCollapsed ? 'p-6' : 'p-8'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditMode && <GripVertical size={18} className="text-indigo-400 cursor-grab" />}
            <div className={`p-2 rounded-xl ${isCritical ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {isCritical ? <AlertTriangle size={20} /> : <TrendingUp size={20} />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight uppercase tracking-wider">
                {isCritical ? 'Kritik Stok Uyarıları' : 'Son Aktiviteler'}
              </h3>
              {isCollapsed && (
                <p className="text-xs text-slate-400 font-medium">
                  {isCritical 
                    ? `${lowStockItems.length} kritik seviye ürün`
                    : `${sales.length + logs.length} kayıtlı hareket`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isEditMode && (
              <>
                <button 
                  onClick={() => moveSection(id, 'up')} 
                  disabled={sectionIndex === 0}
                  title="Yukarı Taşı"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-25"
                >
                  <ArrowUp size={16} />
                </button>
                <button 
                  onClick={() => moveSection(id, 'down')} 
                  disabled={sectionIndex === layout.sectionOrder.length - 1}
                  title="Aşağı Taşı"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-25"
                >
                  <ArrowDown size={16} />
                </button>
                <button 
                  onClick={() => toggleSectionVisibility(id)} 
                  title="Gizle"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                  <EyeOff size={16} />
                </button>
              </>
            )}
            <button 
              onClick={() => toggleSectionCollapse(id)} 
              title={isCollapsed ? 'Genişlet (Aç)' : 'Daralt (Kapat)'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            >
              {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="mt-6 flex-1">
            {isCritical ? (
              lowStockItems.length === 0 ? (
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
                          <td className="px-6 py-4 font-black text-slate-800 text-sm">{item.name}</td>
                          <td className="px-6 py-4 text-center font-black text-red-600 text-base">{item.quantity} {item.unit}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-600 uppercase tracking-widest animate-pulse">
                              KRİTİK
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
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
            )}
          </div>
        )}
      </div>
    );
  };

  // Dinamik sıralı bölümler oluşturma
  const renderAllSections = () => {
    const elements: React.ReactNode[] = [];
    const order = layout.sectionOrder;

    for (let i = 0; i < order.length; i++) {
      const currentId = order[i];
      if (!layout.sectionVisible[currentId]) continue;

      const nextId = order[i + 1];
      const isPairable = 
        (currentId === 'critical_list' && nextId === 'activities' && layout.sectionVisible.activities) ||
        (currentId === 'activities' && nextId === 'critical_list' && layout.sectionVisible.critical_list);

      if (isPairable) {
        // İki tablo yan yana ardışık ise 2 kolonlu ızgarada göster
        elements.push(
          <div key={`pair-${currentId}-${nextId}`} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {renderDetailCard(currentId as 'critical_list' | 'activities', i)}
            {renderDetailCard(nextId as 'critical_list' | 'activities', i + 1)}
          </div>
        );
        i++; // İkinci öğeyi atla
      } else if (currentId === 'critical_list' || currentId === 'activities') {
        elements.push(
          <div key={currentId} className="w-full">
            {renderDetailCard(currentId, i)}
          </div>
        );
      } else if (currentId === 'chart') {
        elements.push(renderChartSection(i));
      } else if (currentId === 'stats') {
        elements.push(renderStatsSection(i));
      }
    }

    if (elements.length === 0) {
      return (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-800">Tüm Paneller Gizlendi</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Görüntülenecek aktif kutucuk kalmadı. Paneli tekrar yapılandırmak için aşağıdaki butona tıklayın.
          </p>
          <button 
            onClick={showAllWidgets}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95"
          >
            Tüm Kutucukları Göster
          </button>
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Üst Başlık ve Düzenleme Araç Çubuğu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">İşletme Paneli</h2>
          <p className="text-slate-500 font-medium">Hoş geldiniz, işletmenizin son durumu burada.</p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Gizli Kutular Bildirimi */}
          {totalHiddenCount > 0 && (
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all"
            >
              <EyeOff size={14} />
              <span>{totalHiddenCount} Kutu Gizli</span>
            </button>
          )}

          {/* Hızlı Düzenleme Modu Düğmesi */}
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 ${
              isEditMode 
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>{isEditMode ? 'Düzenlemeyi Bitir' : 'Kutuları Düzenle'}</span>
          </button>

          {/* Paneli Özelleştir Modal Butonu */}
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            <LayoutDashboard size={15} />
            <span>Paneli Özelleştir</span>
          </button>
        </div>
      </div>

      {/* Düzenleme Modu Bilgi Çubuğu */}
      {isEditMode && (
        <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">Kutucuk Düzenleme Modu Aktif</p>
              <p className="text-xs text-indigo-100 font-medium">
                Kutucukları oklar (↑ ↓ ← →) ile taşıyabilir veya sürükleyerek sıralayabilirsiniz. Göz simgesi ile kutuları gizleyebilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button 
              onClick={resetToDefault}
              className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Varsayılana Dön
            </button>
            <button 
              onClick={() => setIsEditMode(false)}
              className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              Kaydet & Bitir
            </button>
          </div>
        </div>
      )}

      {/* Dinamik Olarak Sıralanan ve Açılıp Kapanan Kutucuklar */}
      <div className="space-y-8">
        {renderAllSections()}
      </div>

      {/* Paneli Özelleştirme Modalı */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Modal Başlığı */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg tracking-tight">Paneli Özelleştir</h3>
                  <p className="text-xs text-slate-500 font-medium">Kutucukların görünürlüğünü, açılış durumunu ve sıralamasını yönetin.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal İçeriği */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
              {/* Ana Bölümler */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ana Bölümler &amp; Tablolar</h4>
                <div className="space-y-2">
                  {layout.sectionOrder.map((secId, index) => {
                    const isVisible = layout.sectionVisible[secId];
                    const isCollapsed = layout.sectionCollapsed[secId];

                    return (
                      <div 
                        key={secId}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                          isVisible ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-sm truncate">{sectionTitles[secId]}</p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {isVisible ? (isCollapsed ? 'Görünür (İçerik Daraltılmış)' : 'Görünür (Tam Açık)') : 'Gizli'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={() => moveSection(secId, 'up')} 
                            disabled={index === 0}
                            title="Yukarı Taşı"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-20"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button 
                            onClick={() => moveSection(secId, 'down')} 
                            disabled={index === layout.sectionOrder.length - 1}
                            title="Aşağı Taşı"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-20"
                          >
                            <ArrowDown size={15} />
                          </button>
                          <button 
                            onClick={() => toggleSectionCollapse(secId)}
                            title={isCollapsed ? 'Genişlet (Aç)' : 'Daralt (Kapat)'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isCollapsed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                          </button>
                          <button 
                            onClick={() => toggleSectionVisibility(secId)}
                            title={isVisible ? 'Gizle' : 'Göster'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isVisible 
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                            }`}
                          >
                            {isVisible ? <><Check size={13} /> Açık</> : <><EyeOff size={13} /> Gizli</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metrik Kartları */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Özet Metrik Kartları</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {layout.statOrder.map((statId, index) => {
                    const isVisible = layout.statVisible[statId];
                    const isCollapsed = layout.statCollapsed[statId];
                    const def = statDefinitions[statId];

                    return (
                      <div 
                        key={statId}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                          isVisible ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-200/60 opacity-60'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate">{def.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{def.value}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => moveStat(statId, 'left')} 
                            disabled={index === 0}
                            title="Sola Taşı"
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-20"
                          >
                            <ArrowLeft size={13} />
                          </button>
                          <button 
                            onClick={() => moveStat(statId, 'right')} 
                            disabled={index === layout.statOrder.length - 1}
                            title="Sağa Taşı"
                            className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-20"
                          >
                            <ArrowRight size={13} />
                          </button>
                          <button 
                            onClick={() => toggleStatCollapse(statId)}
                            title={isCollapsed ? 'Aç' : 'Daralt'}
                            className={`p-1 rounded-lg border text-xs ${
                              isCollapsed ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                          </button>
                          <button 
                            onClick={() => toggleStatVisibility(statId)}
                            title={isVisible ? 'Gizle' : 'Göster'}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                              isVisible ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isVisible ? 'Açık' : 'Gizli'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Alt Çubuğu */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={resetToDefault}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-white transition-colors"
                >
                  <RotateCcw size={14} /> Varsayılana Sıfırla
                </button>
                <button 
                  onClick={showAllWidgets}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 text-xs font-bold transition-colors"
                >
                  Tümünü Göster
                </button>
              </div>

              <button 
                onClick={() => setShowSettingsModal(false)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                Tamamlandı
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
