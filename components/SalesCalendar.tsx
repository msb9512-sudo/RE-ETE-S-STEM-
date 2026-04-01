
import React, { useState } from 'react';
import { Sale, Recipe } from '../types';
import { CalendarDays, ChevronLeft, ChevronRight, ShoppingBag, X, TrendingUp } from 'lucide-react';

interface SalesCalendarProps {
  sales: Sale[];
  recipes: Recipe[];
}

export const SalesCalendar: React.FC<SalesCalendarProps> = ({ sales, recipes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Takvimde boşluklar için (Pazartesi başlangıçlı yapmak için düzeltme)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const getSalesForDay = (day: number) => {
    return sales.filter(sale => {
      const d = new Date(sale.timestamp);
      return d.getDate() === day && 
             d.getMonth() === currentDate.getMonth() && 
             d.getFullYear() === currentDate.getFullYear();
    });
  };

  const getDayDetails = (day: number) => {
    const daySales = getSalesForDay(day);
    const summary: Record<string, { qty: number, total: number, name: string }> = {};

    daySales.forEach(sale => {
      const recipe = recipes.find(r => r.id === sale.recipeId);
      const name = recipe?.name || "Bilinmeyen Ürün";
      if (!summary[sale.recipeId]) {
        summary[sale.recipeId] = { qty: 0, total: 0, name };
      }
      summary[sale.recipeId].qty += sale.quantity;
      summary[sale.recipeId].total += sale.totalPrice;
    });

    return Object.values(summary).sort((a, b) => b.total - a.total);
  };

  const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const calendarDays = [];
  for (let i = 0; i < adjustedFirstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= totalDays; i++) calendarDays.push(i);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <CalendarDays className="text-indigo-600" /> Satış Takvimi
          </h2>
          <p className="text-slate-500 font-medium">Günlük performans ve ürün bazlı satış analizi.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronLeft size={20}/></button>
           <span className="font-black text-slate-800 text-lg min-w-[140px] text-center uppercase tracking-widest">
             {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
           </span>
           <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Takvim Izgarası */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8">
           <div className="grid grid-cols-7 mb-4">
             {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
               <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</div>
             ))}
           </div>
           <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                
                const daySales = getSalesForDay(day);
                const dailyTotal = daySales.reduce((acc, s) => acc + s.totalPrice, 0);
                const isSelected = selectedDay === day;
                const hasSales = daySales.length > 0;

                return (
                  <button 
                    key={day} 
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square rounded-3xl p-3 flex flex-col items-center justify-between border-2 transition-all group ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 scale-105 z-10' : 
                      hasSales ? 'bg-white border-indigo-100 hover:border-indigo-400' : 
                      'bg-slate-50 border-transparent text-slate-300'
                    }`}
                  >
                    <span className={`text-sm font-black ${isSelected ? 'text-white' : hasSales ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
                    {hasSales && (
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black ${isSelected ? 'text-indigo-100' : 'text-indigo-600'}`}>
                          ₺{dailyTotal >= 1000 ? (dailyTotal/1000).toFixed(1) + 'k' : dailyTotal.toFixed(0)}
                        </span>
                        <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></div>
                      </div>
                    )}
                  </button>
                );
              })}
           </div>
        </div>

        {/* Günlük Detay Paneli */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 text-white flex flex-col relative overflow-hidden">
           {selectedDay ? (
             <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col h-full">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedDay} {monthNames[currentDate.getMonth()]}</h3>
                    <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-1">Günlük Satış Özeti</p>
                  </div>
                  <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20">
                    <TrendingUp size={24} />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {getDayDetails(selectedDay).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-indigo-300/40">
                       <ShoppingBag size={48} className="mb-4 opacity-20" />
                       <p className="font-bold">Bu gün için satış kaydı yok.</p>
                    </div>
                  ) : (
                    getDayDetails(selectedDay).map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                         <div className="flex-1">
                            <p className="font-bold text-sm text-indigo-50">{item.name}</p>
                            <p className="text-[10px] text-indigo-300/60 font-black uppercase tracking-tighter">{item.qty} Adet Satıldı</p>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-white">₺{item.total.toLocaleString()}</p>
                         </div>
                      </div>
                    ))
                  )}
               </div>

               {getDayDetails(selectedDay).length > 0 && (
                 <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                       <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">Toplam Ciro</p>
                       <p className="text-3xl font-black text-white tracking-tighter">
                         ₺{getSalesForDay(selectedDay).reduce((a, s) => a + s.totalPrice, 0).toLocaleString()}
                       </p>
                    </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                <CalendarDays size={64} className="mb-2" />
                <h4 className="text-xl font-bold">Bir Gün Seçin</h4>
                <p className="text-sm max-w-[200px] font-medium italic">Detaylı ürün dökümünü görmek için soldaki takvimden bir güne tıklayın.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
