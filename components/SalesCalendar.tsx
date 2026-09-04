import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Recipe, User, Role } from '../types';
import { 
  CalendarDays, ChevronLeft, ChevronRight, ShoppingBag, X, TrendingUp, 
  Lock, KeyRound, ShieldAlert, CheckCircle, AlertTriangle, 
  Trash2, Edit3, Eye, EyeOff, Clock, User as UserIcon, Plus, Minus, Check,
  Layers, ReceiptText
} from 'lucide-react';

interface SalesCalendarProps {
  sales: Sale[];
  recipes: Recipe[];
  users?: User[];
  currentUser?: User | null;
  onCorrectSale?: (saleId: string, newQuantity: number, reason: string, adminName: string) => void;
}

export const SalesCalendar: React.FC<SalesCalendarProps> = ({ 
  sales, 
  recipes, 
  users = [], 
  currentUser = null, 
  onCorrectSale 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [activeTab, setActiveTab] = useState<'transactions' | 'summary'>('transactions');

  // Düzeltme Modalı State'leri
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [selectedAdminUsername, setSelectedAdminUsername] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Düzeltme Formu State'leri
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sistemdeki yöneticileri filtrele (Role.ADMIN)
  const adminUsers = useMemo(() => {
    const list = users.filter(u => u.role === Role.ADMIN);
    if (list.length > 0) return list;
    // Fallback: Eğer kullanıcı listesinde admin yoksa mevcut kullanıcıyı veya admin varsayılanını kullan
    if (currentUser?.role === Role.ADMIN) return [currentUser];
    return [{ id: 'default-admin', name: 'Yönetici (admin)', username: 'admin', password: '123', role: Role.ADMIN, securityQuestion: '', securityAnswer: '' }];
  }, [users, currentUser]);

  // İlk admin kullanıcısını varsayılan seç
  useEffect(() => {
    if (adminUsers.length > 0 && !selectedAdminUsername) {
      if (currentUser?.role === Role.ADMIN) {
        setSelectedAdminUsername(currentUser.username);
      } else {
        setSelectedAdminUsername(adminUsers[0].username);
      }
    }
  }, [adminUsers, currentUser, selectedAdminUsername]);

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
    }).sort((a, b) => b.timestamp - a.timestamp); // En yeni satış üstte
  };

  const getDayDetails = (day: number) => {
    const daySales = getSalesForDay(day);
    const summary: Record<string, { qty: number, total: number, name: string, price: number, recipeId: string }> = {};

    daySales.forEach(sale => {
      const recipe = recipes.find(r => r.id === sale.recipeId);
      const name = recipe?.name || "Bilinmeyen Ürün";
      const price = recipe?.price || (sale.quantity > 0 ? sale.totalPrice / sale.quantity : 0);
      if (!summary[sale.recipeId]) {
        summary[sale.recipeId] = { qty: 0, total: 0, name, price, recipeId: sale.recipeId };
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

  // Satış Düzeltme Modalı Aç
  const handleOpenEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setIsAuthVerified(false);
    setPasswordInput('');
    setAuthError('');
    setNewQuantity(sale.quantity);
    setReason('Garson sehven fazla/yanlış girdi');
    
    // Eğer mevcut kullanıcı yönetici ise adını otomatik ayarla
    if (currentUser?.role === Role.ADMIN) {
      setSelectedAdminUsername(currentUser.username);
    } else if (adminUsers.length > 0) {
      setSelectedAdminUsername(adminUsers[0].username);
    }
  };

  // Yönetici Şifresi Doğrulama
  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');

    const targetAdmin = adminUsers.find(u => u.username.toLowerCase() === selectedAdminUsername.toLowerCase());
    
    if (!targetAdmin) {
      setAuthError('Seçilen yönetici hesabı bulunamadı!');
      return;
    }

    if (targetAdmin.password === passwordInput) {
      setIsAuthVerified(true);
      setAuthError('');
    } else {
      setAuthError('Hatalı yönetici şifresi! Lütfen tekrar deneyin.');
    }
  };

  // Düzeltmeyi Tamamla
  const handleSaveCorrection = (qtyToSave: number) => {
    if (!editingSale || !onCorrectSale) return;

    const targetAdmin = adminUsers.find(u => u.username === selectedAdminUsername) || currentUser;
    const adminName = targetAdmin?.name || 'Yönetici';
    const finalReason = reason.trim() || 'Hatalı giriş düzeltildi';

    onCorrectSale(editingSale.id, qtyToSave, finalReason, adminName);

    const recipe = recipes.find(r => r.id === editingSale.recipeId);
    const recipeName = recipe?.name || 'Ürün';

    setSuccessToast(
      qtyToSave <= 0 
        ? `"${recipeName}" satışı iptal edildi ve hammaddeler stoğa iade edildi.` 
        : `"${recipeName}" satışı ${qtyToSave} adet olarak güncellendi.`
    );
    setTimeout(() => setSuccessToast(null), 4000);

    setEditingSale(null);
  };

  const editingRecipe = editingSale ? recipes.find(r => r.id === editingSale.recipeId) : null;
  const unitPrice = editingRecipe ? editingRecipe.price : (editingSale && editingSale.quantity > 0 ? editingSale.totalPrice / editingSale.quantity : 0);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const selectedDaySales = selectedDay ? getSalesForDay(selectedDay) : [];
  const selectedDayTotalRevenue = selectedDaySales.reduce((acc, s) => acc + s.totalPrice, 0);
  const selectedDayTotalQty = selectedDaySales.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Toast Bildirimi */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 font-bold text-sm border border-emerald-400/40">
          <CheckCircle size={20} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Üst Başlık & Ay Gezintisi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <CalendarDays className="text-indigo-600" /> Satış Takvimi & İşlem Düzeltme
          </h2>
          <p className="text-slate-500 font-medium">Günlük ciro takibi, geçmiş satış hareketleri ve yönetici yetkili kayıt düzeltme.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-all" title="Önceki Ay"><ChevronLeft size={20}/></button>
           <span className="font-black text-slate-800 text-lg min-w-[140px] text-center uppercase tracking-widest">
             {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
           </span>
           <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-all" title="Sonraki Ay"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Panel: Takvim Izgarası */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col justify-between">
           <div>
             <div className="grid grid-cols-7 mb-4">
               {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                 <div key={d} className="text-center text-[11px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</div>
               ))}
             </div>
             <div className="grid grid-cols-7 gap-2.5 sm:gap-3.5">
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
                      className={`aspect-square rounded-2xl sm:rounded-3xl p-2 sm:p-3 flex flex-col items-center justify-between border-2 transition-all group ${
                        isSelected ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100 scale-105 z-10' : 
                        hasSales ? 'bg-white border-indigo-100 hover:border-indigo-400' : 
                        'bg-slate-50 border-transparent text-slate-300 hover:bg-slate-100/70'
                      }`}
                    >
                      <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-white' : hasSales ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
                      {hasSales && (
                        <div className="flex flex-col items-center">
                          <span className={`text-[9px] sm:text-[10px] font-black ${isSelected ? 'text-indigo-100' : 'text-indigo-600'}`}>
                            ₺{dailyTotal >= 1000 ? (dailyTotal/1000).toFixed(1) + 'k' : dailyTotal.toFixed(0)}
                          </span>
                          <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></div>
                        </div>
                      )}
                    </button>
                  );
                })}
             </div>
           </div>

           {/* Takvim Altı Bilgilendirme */}
           <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-400 gap-2">
             <div className="flex items-center gap-4">
               <span className="flex items-center gap-1.5">
                 <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Satış Olan Günler
               </span>
               <span className="flex items-center gap-1.5">
                 <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span> Satış Olmayan Günler
               </span>
             </div>
             <span className="text-slate-500 font-medium">Hatalı satışları düzeltmek için güne tıklayıp fiş üzerindeki "Düzelt" butonunu kullanın.</span>
           </div>
        </div>

        {/* Sağ Panel: Günlük Detay Paneli */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-6 md:p-8 text-white flex flex-col relative overflow-hidden h-[620px]">
           {selectedDay ? (
             <div className="animate-in slide-in-from-right-4 duration-500 flex flex-col h-full">
               {/* Başlık & Günlük Toplam */}
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedDay} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                    <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-0.5">
                      {selectedDaySales.length} Satış Hareketi | {selectedDayTotalQty} Adet Ürün
                    </p>
                  </div>
                  <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 shrink-0">
                    <TrendingUp size={22} />
                  </div>
               </div>

               {/* Sekmeler: Fişler vs Özet */}
               <div className="flex bg-white/10 p-1 rounded-2xl mb-4 shrink-0">
                 <button
                   onClick={() => setActiveTab('transactions')}
                   className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                     activeTab === 'transactions' 
                       ? 'bg-indigo-600 text-white shadow-lg' 
                       : 'text-slate-300 hover:text-white'
                   }`}
                 >
                   <ReceiptText size={14} /> Satış Fişleri & Düzeltme
                 </button>
                 <button
                   onClick={() => setActiveTab('summary')}
                   className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                     activeTab === 'summary' 
                       ? 'bg-indigo-600 text-white shadow-lg' 
                       : 'text-slate-300 hover:text-white'
                   }`}
                 >
                   <Layers size={14} /> Ürün Dağılımı
                 </button>
               </div>

               {/* İçerik Listesi */}
               <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-3">
                  {selectedDaySales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-indigo-300/40">
                       <ShoppingBag size={48} className="mb-4 opacity-20" />
                       <p className="font-bold">Bu güne ait satış kaydı bulunmuyor.</p>
                    </div>
                  ) : activeTab === 'transactions' ? (
                    // Satış Fişleri Listesi (Tek tek düzeltilebilir)
                    selectedDaySales.map((sale) => {
                      const recipe = recipes.find(r => r.id === sale.recipeId);
                      return (
                        <div 
                          key={sale.id} 
                          className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3 group hover:bg-white/10 transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                <Clock size={10} /> {formatTime(sale.timestamp)}
                              </span>
                              <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-md font-bold truncate max-w-[110px] flex items-center gap-1">
                                <UserIcon size={10} /> {sale.staffName || 'Garson'}
                              </span>
                            </div>
                            <p className="font-bold text-sm text-indigo-50 truncate">{recipe?.name || 'Ürün'}</p>
                            <p className="text-[11px] text-indigo-200/70 font-semibold mt-0.5">
                              {sale.quantity} Adet × ₺{(recipe?.price || (sale.totalPrice / sale.quantity)).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="font-black text-white text-base">₺{sale.totalPrice.toLocaleString('tr-TR')}</p>
                            </div>
                            <button
                              onClick={() => handleOpenEditModal(sale)}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-900 border border-amber-400/40 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                              title="Hatalı satışı yönetici şifresiyle düzelt"
                            >
                              <Edit3 size={12} /> Düzelt
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Ürün Dağılımı Özeti
                    getDayDetails(selectedDay).map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                         <div className="flex-1 min-w-0 pr-3">
                            <p className="font-bold text-sm text-indigo-50 truncate">{item.name}</p>
                            <p className="text-[10px] text-indigo-300/70 font-black uppercase tracking-wider mt-0.5">
                              Toplam {item.qty} Adet Satıldı (Birim: ₺{item.price.toFixed(2)})
                            </p>
                         </div>
                         <div className="flex items-center gap-3 shrink-0">
                            <p className="font-black text-white text-base">₺{item.total.toLocaleString('tr-TR')}</p>
                            <button
                              onClick={() => {
                                setActiveTab('transactions');
                              }}
                              className="p-1.5 bg-white/10 hover:bg-white/20 text-indigo-200 rounded-lg text-xs font-bold transition-all"
                              title="Bu güne ait fişleri göster"
                            >
                              Fişler →
                            </button>
                         </div>
                      </div>
                    ))
                  )}
               </div>

               {/* Alt Toplam Çubuğu */}
               {selectedDaySales.length > 0 && (
                 <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end shrink-0">
                    <div>
                       <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-0.5">Günlük Toplam Ciro</p>
                       <p className="text-3xl font-black text-white tracking-tight">
                         ₺{selectedDayTotalRevenue.toLocaleString('tr-TR')}
                       </p>
                    </div>
                    <div className="text-right">
                       <span className="text-xs bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full font-bold border border-indigo-400/20">
                         {selectedDaySales.length} Fiş
                       </span>
                    </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                <CalendarDays size={64} className="mb-2" />
                <h4 className="text-xl font-bold">Bir Gün Seçin</h4>
                <p className="text-sm max-w-[200px] font-medium italic">Detaylı ürün dökümü ve satış düzeltme için soldaki takvimden bir güne tıklayın.</p>
             </div>
           )}
        </div>
      </div>

      {/* YÖNETİCİ ŞİFRESİ VE SATIŞ DÜZELTME MODALI */}
      {editingSale && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Başlık */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isAuthVerified ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                  {isAuthVerified ? <ShieldAlert size={20} /> : <Lock size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">
                    {isAuthVerified ? 'Satış Kaydını Düzelt / İptal Et' : 'Yönetici Şifre Doğrulaması'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {isAuthVerified ? 'Yeni satış miktarını ve nedenini girin' : 'Yetkisiz müdahaleyi önlemek için yönetici şifresi gereklidir'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingSale(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* AŞAMA 1: ŞİFRE DOĞRULAMA EKRANI */}
            {!isAuthVerified ? (
              <form onSubmit={handleVerifyPassword} className="p-6 space-y-5">
                <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-amber-800 font-medium leading-relaxed">
                    Bu işlem satış cirosunu, adisyon kaydını ve mutfak/bar stoklarını otomatik olarak güncelleyecektir. Lütfen yönetici şifresini girin.
                  </div>
                </div>

                {/* Satış Özeti */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Ürün:</span>
                    <span className="font-bold text-slate-800">{editingRecipe?.name || 'Ürün'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Kayıtlı Adet & Tutar:</span>
                    <span className="font-bold text-slate-800">{editingSale.quantity} Adet (₺{editingSale.totalPrice.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">İşlem Saati & Personel:</span>
                    <span className="font-bold text-slate-800">{formatTime(editingSale.timestamp)} - {editingSale.staffName}</span>
                  </div>
                </div>

                {/* Yönetici Seçimi */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Yetkili Yönetici
                  </label>
                  <select
                    value={selectedAdminUsername}
                    onChange={(e) => setSelectedAdminUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    {adminUsers.map(u => (
                      <option key={u.id} value={u.username}>
                        {u.name} (@{u.username})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Şifre Alanı */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Yönetici Şifresi
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Şifrenizi girin..."
                      autoFocus
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {authError && (
                    <p className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1.5 animate-in fade-in">
                      <AlertTriangle size={14} /> {authError}
                    </p>
                  )}
                </div>

                {/* Butonlar */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <KeyRound size={16} /> Şifreyi Doğrula
                  </button>
                </div>
              </form>
            ) : (
              /* AŞAMA 2: SATIŞ DÜZELTME FORMU */
              <div className="p-6 space-y-5">
                {/* Onay Rozeti */}
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span>Yetki Doğrulandı: {adminUsers.find(u => u.username === selectedAdminUsername)?.name || 'Yönetici'}</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                    GÜVENLİ İŞLEM
                  </span>
                </div>

                {/* Ürün & Fiş Bilgisi */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Düzeltilen Ürün:</span>
                    <span className="font-black text-slate-800 text-sm">{editingRecipe?.name || 'Ürün'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Mevcut Kayıt:</span>
                    <span className="font-bold text-slate-700">
                      {editingSale.quantity} Adet × ₺{unitPrice.toFixed(2)} = ₺{editingSale.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Kayıt Eden Personel:</span>
                    <span className="font-bold text-slate-700">{editingSale.staffName} ({formatTime(editingSale.timestamp)})</span>
                  </div>
                </div>

                {/* Yeni Miktar Belirleme */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Doğru Satış Adedi
                    </label>
                    <span className="text-xs font-bold text-indigo-600">
                      Yeni Tutar: ₺{(newQuantity * unitPrice).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNewQuantity(prev => Math.max(0, prev - 1))}
                      className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-lg flex items-center justify-center transition-all active:scale-95"
                      title="1 Azalt"
                    >
                      <Minus size={18} />
                    </button>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setNewQuantity(isNaN(val) ? 0 : Math.max(0, val));
                      }}
                      className="flex-1 h-12 text-center text-xl font-black text-slate-800 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setNewQuantity(prev => prev + 1)}
                      className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-lg flex items-center justify-center transition-all active:scale-95"
                      title="1 Arttır"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Stok Etki Özeti */}
                {newQuantity === 0 ? (
                  <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
                    <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Satış Tamamen İptal Edilecek (Silinecek)</p>
                      <p className="text-red-600 mt-0.5">Bu satış kaydı sistemden kaldırılacak ve harcanan tüm hammadde depoya eksiksiz iade edilecektir.</p>
                    </div>
                  </div>
                ) : newQuantity < editingSale.quantity ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
                    <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Stoğa İade Yapılacak ({editingSale.quantity - newQuantity} Adet)</p>
                      <p className="text-emerald-700 mt-0.5">Fazla girilen {editingSale.quantity - newQuantity} adet ürünün hammaddesi depoya geri yüklenecek ve ciro düşürülecektir.</p>
                    </div>
                  </div>
                ) : newQuantity > editingSale.quantity ? (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Stoktan Ekstra Düşüş Yapılacak (+{newQuantity - editingSale.quantity} Adet)</p>
                      <p className="text-amber-700 mt-0.5">Eksik girilen {newQuantity - editingSale.quantity} adet ürünün hammaddesi depodan düşülecek ve ciro artırılacaktır.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 font-medium text-center">
                    Miktar değiştirilmedi ({newQuantity} Adet).
                  </div>
                )}

                {/* Düzeltme Nedeni */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Düzeltme Nedeni
                  </label>
                  
                  {/* Hazır Hızlı Butonlar */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {[
                      'Garson Yanlış Adet Girdi',
                      'Müşteri Siparişi İptal Etti',
                      'Adisyon Hatası',
                      'Mükerrer (Çift) Kayıt'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReason(preset)}
                        className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all border ${
                          reason === preset 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Düzeltme açıklamasını yazın..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all order-3 sm:order-1"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCorrection(0)}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 order-2"
                  >
                    <Trash2 size={14} /> Satışı İptal Et / Sil
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCorrection(newQuantity)}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 order-1 sm:order-3"
                  >
                    <CheckCircle size={16} /> Değişikliği Onayla & Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
