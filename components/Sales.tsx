
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Recipe, Sale } from '../types';
import { ShoppingCart, Plus, Minus, CheckCircle, ShieldAlert, Search, X, UtensilsCrossed, Filter, Calendar } from 'lucide-react';

interface SalesProps {
  recipes: Recipe[];
  onMakeSale: (recipeId: string, qty: number, staffName: string, timestamp?: number) => void;
  isReadonly?: boolean;
}

export const Sales: React.FC<SalesProps> = ({ recipes, onMakeSale, isReadonly = false }) => {
  const [cart, setCart] = useState<{recipeId: string, qty: number}[]>([]);
  const [staffName, setStaffName] = useState("Garson 1");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const cartEndRef = useRef<HTMLDivElement>(null);

  // Yeni ürün eklendikçe sepet listesini otomatik olarak en alta kaydır
  useEffect(() => {
    if (cart.length > 0) {
      cartEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [cart]);

  // Kategorileri reçetelerden dinamik ve alfabetik olarak çıkar
  const categories = useMemo(() => {
    // Cast to string[] to resolve 'localeCompare' does not exist on type 'unknown' error
    const cats = Array.from(new Set(recipes.map(r => r.category))) as string[];
    return cats.sort((a, b) => a.localeCompare(b, 'tr'));
  }, [recipes]);

  // Filtreleme mantığı
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, selectedCategory]);

  const addToCart = (recipeId: string) => {
    if (isReadonly) return;
    setCart(prev => {
      const existing = prev.find(item => item.recipeId === recipeId);
      if (existing) return prev.map(item => item.recipeId === recipeId ? {...item, qty: item.qty + 1} : item);
      return [...prev, { recipeId, qty: 1 }];
    });
  };

  const removeFromCart = (recipeId: string) => {
    if (isReadonly) return;
    setCart(prev => {
      const existing = prev.find(item => item.recipeId === recipeId);
      if (existing && existing.qty > 1) return prev.map(item => item.recipeId === recipeId ? {...item, qty: item.qty - 1} : item);
      return prev.filter(item => item.recipeId !== recipeId);
    });
  };

  const updateCartQty = (recipeId: string, newQty: number) => {
    if (isReadonly) return;
    if (isNaN(newQty) || newQty <= 0) {
      setCart(prev => prev.filter(item => item.recipeId !== recipeId));
    } else {
      setCart(prev => prev.map(item => item.recipeId === recipeId ? { ...item, qty: Math.max(1, Math.floor(newQty)) } : item));
    }
  };

  const handleCompleteSale = () => {
    const validCart = cart.filter(item => item.qty > 0);
    if (isReadonly || validCart.length === 0) return;
    
    // Seçilen tarihi timestamp'e çevir (Günün başlangıcı + şu anki saat/dakika/saniye)
    const selectedDate = new Date(saleDate);
    const now = new Date();
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    const timestamp = selectedDate.getTime();

    validCart.forEach(item => onMakeSale(item.recipeId, item.qty, staffName, timestamp));
    setCart([]);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] animate-fade-in">
      {/* Sol Panel: Ürün Seçimi */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
               <UtensilsCrossed className="text-indigo-600" /> Satış Terminali
            </h2>
            <p className="text-slate-500 font-medium">Hızlı satış ve adisyon yönetimi.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Filter size={16} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {filteredRecipes.length} Ürün Listeleniyor
            </span>
          </div>
        </div>

        {/* Arama ve Kategori Filtreleme Paneli */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-200 mb-6 space-y-5">
          <div className="relative group flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Hangi ürünü arıyorsunuz?" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-800 text-lg placeholder:text-slate-300"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <Search size={24} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
            <button 
              onClick={() => setSelectedCategory("ALL")}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all border-2 ${selectedCategory === "ALL" ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
            >
              HEPSİ
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all border-2 ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Ürün Listesi */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
            {filteredRecipes.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                 <div className="bg-slate-50 p-6 rounded-full mb-4">
                   <Search size={48} className="text-slate-200" />
                 </div>
                 <p className="text-slate-400 font-bold text-lg tracking-tight">Eşleşen ürün bulunamadı.</p>
                 <button onClick={() => {setSearchTerm(""); setSelectedCategory("ALL")}} className="mt-4 text-indigo-600 font-black text-sm hover:underline">Filtreleri Temizle</button>
              </div>
            ) : (
              filteredRecipes.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => addToCart(recipe.id)}
                  disabled={isReadonly}
                  className="bg-white hover:bg-indigo-50 border border-slate-200 p-5 rounded-[2.5rem] text-left shadow-sm transition-all active:scale-95 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-300 hover:shadow-xl"
                >
                  <div className="absolute -right-3 -top-3 bg-indigo-100 w-16 h-16 rounded-full opacity-0 group-hover:opacity-20 transition-all group-hover:scale-150"></div>
                  <h3 className="font-black text-slate-800 leading-tight mb-2 h-10 overflow-hidden line-clamp-2">{recipe.name}</h3>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">{recipe.category}</span>
                    <div className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl text-sm">₺{recipe.price.toFixed(0)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sağ Panel: Adisyon Sepeti */}
      <div className="w-full lg:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-full relative overflow-hidden shrink-0">
        {isReadonly && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert size={64} className="text-red-500 mb-4 animate-pulse" />
            <h4 className="font-black text-white text-xl uppercase tracking-widest">SATIŞA KAPALI</h4>
            <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">Lisans süresi sona erdiği için işlem yapılamaz.</p>
          </div>
        )}
        
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 shrink-0">
           <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-slate-800 text-xl flex items-center gap-2.5">
                <ShoppingCart size={22} className="text-indigo-600" /> Adisyon
              </h3>
              <div className="flex flex-col items-end">
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md shadow-indigo-100">
                  {cart.length} ÜRÜN
                </span>
              </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative group">
                <input 
                  type="text" 
                  value={staffName} 
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 text-xs shadow-xs transition-all"
                  placeholder="Personel İsmi..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Plus size={14} strokeWidth={3} />
                </div>
              </div>

              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={14} />
                <input 
                  type="date" 
                  value={saleDate} 
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700 text-xs shadow-xs transition-all"
                />
              </div>
           </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-2.5 custom-scrollbar bg-white scroll-smooth">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30 space-y-3 py-16">
               <div className="bg-slate-100 p-6 rounded-full text-slate-400">
                 <ShoppingCart size={48} />
               </div>
               <p className="font-bold text-slate-500 text-sm">Sepet Boş - Soldan ürün ekleyin</p>
            </div>
          ) : (
            cart.map(item => {
              const recipe = recipes.find(r => r.id === item.recipeId);
              return recipe && (
                <div key={item.recipeId} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100 group animate-in slide-in-from-right-4 hover:border-indigo-200 transition-all">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-bold text-slate-800 text-sm leading-tight truncate">{recipe.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">₺{recipe.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-xs border border-slate-100 shrink-0">
                    <button 
                      onClick={() => removeFromCart(item.recipeId)} 
                      disabled={isReadonly}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                      title="Azalt"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>

                    <input 
                      type="number"
                      min="1"
                      step="1"
                      disabled={isReadonly}
                      value={item.qty === 0 ? '' : item.qty}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCart(prev => prev.map(i => i.recipeId === item.recipeId ? { ...i, qty: 0 } : i));
                        } else {
                          const parsed = parseInt(val, 10);
                          if (!isNaN(parsed)) {
                            setCart(prev => prev.map(i => i.recipeId === item.recipeId ? { ...i, qty: Math.max(0, parsed) } : i));
                          }
                        }
                      }}
                      onBlur={() => {
                        if (item.qty <= 0) {
                          updateCartQty(item.recipeId, 1);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-12 h-8 text-center font-bold text-slate-800 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      title="Miktarı manuel yazmak için tıklayın veya düzenleyin"
                    />

                    <button 
                      onClick={() => addToCart(item.recipeId)} 
                      disabled={isReadonly}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-40"
                      title="Arttır"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={cartEndRef} />
        </div>

        {/* Ödeme Alanı */}
        <div className="shrink-0 p-5 md:p-6 border-t border-slate-800 bg-slate-900 text-white rounded-t-3xl shadow-xl z-10">
          <div className="flex justify-between items-baseline mb-4">
            <div>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Ödenecek Tutar</span>
              <span className="text-3xl md:text-4xl font-black tracking-tight text-white">
                ₺{cart.reduce((t, i) => t + (recipes.find(r => r.id === i.recipeId)?.price || 0) * (i.qty > 0 ? i.qty : 0), 0).toLocaleString('tr-TR')}
              </span>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])} 
                className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors uppercase tracking-wider underline underline-offset-4 decoration-red-800/60 hover:decoration-red-400"
              >
                TEMİZLE
              </button>
            )}
          </div>
          
          {successMsg ? (
            <div className="bg-emerald-500 text-white py-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg shadow-emerald-900/40 animate-in zoom-in text-base">
              <CheckCircle size={24} strokeWidth={2.5}/> SATIŞ TAMAMLANDI
            </div>
          ) : (
            <button 
              onClick={handleCompleteSale} 
              disabled={cart.length === 0 || isReadonly} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-25 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/30 transition-all active:scale-[0.98] text-base flex items-center justify-center gap-3 group"
            >
              <ShoppingCart size={20} className="group-hover:rotate-12 transition-transform" /> 
              SATIŞI ONAYLA
            </button>
          )}
          <p className="text-center text-[10px] text-slate-500 font-medium uppercase mt-3 tracking-widest">POS Terminali</p>
        </div>
      </div>
    </div>
  );
};
