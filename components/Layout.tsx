
import React, { useState } from 'react';
import { ViewState, Role } from '../types';
import { LayoutDashboard, Package, ScrollText, TrendingUp, Hotel, ClipboardCheck, BarChart3, ShoppingBag, LogOut, Settings as SettingsIcon, ChevronDown, ChevronRight, Users, Database, PanelLeftClose, PanelLeftOpen, ShieldAlert, MailCheck, CalendarDays } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
  currentUser: { role: Role; name: string } | null;
  onLogout: () => void;
  licenseExpired?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children, currentUser, onLogout, licenseExpired }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(['settings', 'report-settings', 'import-export'].includes(currentView));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Genel Panel', icon: <LayoutDashboard size={20} />, roles: [Role.ADMIN, Role.CHEF, Role.BAR_MANAGER] },
    { id: 'inventory', label: 'Merkezi Depo', icon: <Package size={20} />, roles: [Role.ADMIN, Role.CHEF, Role.BAR_MANAGER] },
    { id: 'recipes', label: 'Reçeteler', icon: <ScrollText size={20} />, roles: [Role.ADMIN, Role.CHEF, Role.BAR_MANAGER] },
    { id: 'sales', label: 'Satış (POS)', icon: <TrendingUp size={20} />, roles: [Role.ADMIN, Role.WAITER, Role.BAR_MANAGER] },
    { id: 'sales-calendar', label: 'Satış Takvimi', icon: <CalendarDays size={20} />, roles: [Role.ADMIN, Role.BAR_MANAGER] },
    { id: 'purchasing', label: 'Satın Alma', icon: <ShoppingBag size={20} />, roles: [Role.ADMIN, Role.CHEF] },
    { id: 'counting', label: 'Sayım & Fire', icon: <ClipboardCheck size={20} />, roles: [Role.ADMIN, Role.CHEF, Role.BAR_MANAGER] },
    { id: 'reports', label: 'Raporlar', icon: <BarChart3 size={20} />, roles: [Role.ADMIN] },
  ];

  const filteredMenu = menuItems.filter(item => 
    !currentUser || item.roles.includes(currentUser.role)
  );

  const isAdmin = currentUser?.role === Role.ADMIN;

  return (
    <div className="flex h-screen w-screen bg-[#f1f5f9] overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-[#0f172a] text-slate-300 flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out shrink-0`}
      >
        <div className={`p-4 h-20 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-800`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20"><Hotel size={24} /></div>
              <div>
                <h1 className="font-black text-white text-lg tracking-tight">OtelPro</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise</p>
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors">
            {isSidebarCollapsed ? <PanelLeftOpen size={22}/> : <PanelLeftClose size={22} />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <div className={`min-w-[20px] transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              {!isSidebarCollapsed && <span className="font-semibold text-sm truncate">{item.label}</span>}
            </button>
          ))}

          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-slate-800">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 transition-all ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3">
                  <SettingsIcon size={20} />
                  {!isSidebarCollapsed && <span className="font-semibold text-sm">Ayarlar</span>}
                </div>
                {!isSidebarCollapsed && (isSettingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
              </button>
              
              {isSettingsOpen && !isSidebarCollapsed && (
                <div className="mt-1 ml-4 space-y-1 border-l border-slate-700 pl-2 animate-fade-in">
                  <button onClick={() => onChangeView('settings')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${currentView === 'settings' ? 'text-indigo-400 bg-slate-800 font-bold' : 'text-slate-400 hover:text-white'}`}>
                    <Users size={16} /> Üyeler
                  </button>
                  <button onClick={() => onChangeView('report-settings')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${currentView === 'report-settings' ? 'text-indigo-400 bg-slate-800 font-bold' : 'text-slate-400 hover:text-white'}`}>
                    <MailCheck size={16} /> Rapor Ayarları
                  </button>
                  <button onClick={() => onChangeView('import-export')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm ${currentView === 'import-export' ? 'text-indigo-400 bg-slate-800 font-bold' : 'text-slate-400 hover:text-white'}`}>
                    <Database size={16} /> Veri Merkezi
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-[#0f172a]/50">
           <div className={`bg-slate-800/50 rounded-2xl p-3 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} border border-slate-700/50`}>
             {!isSidebarCollapsed && (
               <div className="animate-fade-in">
                 <p className="font-bold text-white text-xs truncate w-24">{currentUser?.name}</p>
                 <p className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">{currentUser?.role}</p>
               </div>
             )}
             <button onClick={onLogout} className="text-slate-500 hover:text-red-400 p-1 transition-colors"><LogOut size={18} /></button>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {licenseExpired && (
          <div className="bg-red-600 text-white p-3 text-center text-xs font-black flex items-center justify-center gap-2 z-30 shadow-lg">
            <ShieldAlert size={16} className="animate-pulse" /> LİSANS SÜRESİ DOLDU - SADECE GÖRÜNTÜLEME MODU AKTİF
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar scroll-smooth bg-[#f8fafc]">
          <div className="max-w-[1400px] mx-auto animate-fade-in h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
