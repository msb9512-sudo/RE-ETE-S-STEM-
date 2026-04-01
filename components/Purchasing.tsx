
import React, { useState } from 'react';
import { InventoryItem, Order, Role } from '../types';
import { ShoppingBag, CheckCircle, AlertCircle, TrendingDown, Clock, PackageCheck, History, Search, Zap, ListFilter } from 'lucide-react';

interface PurchasingProps {
  inventory: InventoryItem[];
  userRole: Role;
  orders?: Order[];
  onCreateOrder: (items: any[], isDirectEntry: boolean) => void;
  onReceiveOrder?: (orderId: string) => void;
  isReadonly?: boolean;
}

export const Purchasing: React.FC<PurchasingProps> = ({ inventory, userRole, orders = [], onCreateOrder, onReceiveOrder, isReadonly = false }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDirectEntry, setIsDirectEntry] = useState(true);

  const lowStockItems = inventory.filter(i => i.quantity <= i.minLevel);
  const filteredAllItems = inventory
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const filteredLowStock = lowStockItems
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const getSuggestedAmount = (item: InventoryItem) => {
    const target = item.minLevel * 2;
    const needed = target - item.quantity;
    return needed > 0 ? parseFloat(needed.toFixed(2)) : Math.max(item.minLevel, 1);
  };

  const handleAddToCart = (id: string, amount: number) => {
    if (isReadonly) return;
    setCart(prev => ({...prev, [id]: amount}));
  };

  const handleCreateOrder = () => {
    if (isReadonly) return;
    const orderItems = Object.entries(cart).map(([id, qty]) => {
      const item = inventory.find(i => i.id === id);
      return {
        inventoryItemId: id,
        orderQuantity: qty,
        costPerUnit: item?.costPerUnit || 0
      };
    });

    if (orderItems.length > 0) {
      onCreateOrder(orderItems, isDirectEntry);
      setOrderPlaced(true);
      setCart({});
      setTimeout(() => setOrderPlaced(false), 3000);
    }
  };

  const totalEstimatedCost = Object.entries(cart).reduce((acc: number, [id, qty]) => {
    const foundItem = inventory.find(i => i.id === id);
    const itemCost = Number(foundItem?.costPerUnit || 0);
    const itemQty = Number(qty || 0);
    return acc + (itemQty * itemCost);
  }, 0);

  if (userRole === Role.WAITER) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <AlertCircle size={48} className="mb-4"/>
        <p>Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    );
  }

  const renderNewOrder = () => {
    if (orderPlaced) {
      return (
        <div className="flex flex-col items-center justify-center h-96 animate-in zoom-in">
          <div className="bg-green-100 p-6 rounded-full mb-4">
            <CheckCircle size={48} className="text-green-600"/>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">İşlem Başarılı!</h2>
          <p className="text-slate-500 mt-2">
            {isDirectEntry ? 'Ürünler doğrudan stoklara eklendi.' : 'Sipariş oluşturuldu, Mal Kabul bekliyor.'}
          </p>
          <button onClick={() => setOrderPlaced(false)} className="mt-4 text-indigo-600 font-medium">Yeni İşlem Yap</button>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Ürün veya kategori arayın..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
             <label className="flex items-center gap-2 cursor-pointer select-none px-2">
               <div className="relative">
                 <input 
                   type="checkbox" 
                   className="sr-only peer" 
                   checked={isDirectEntry}
                   onChange={() => setIsDirectEntry(!isDirectEntry)}
                 />
                 <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
               </div>
               <div className="flex items-center gap-1.5">
                 <Zap size={14} className={isDirectEntry ? 'text-indigo-600' : 'text-slate-400'} />
                 <span className={`text-xs font-bold ${isDirectEntry ? 'text-indigo-700' : 'text-slate-500'}`}>Hızlı Stok Girişi</span>
               </div>
             </label>
             
             {Object.keys(cart).length > 0 && (
               <div className="h-8 w-[1px] bg-slate-200"></div>
             )}

             {Object.keys(cart).length > 0 && (
               <div className="flex items-center gap-4 animate-in slide-in-from-right-4 pr-2">
                 <div className="text-right">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Sepet Toplamı</p>
                   <p className="text-sm font-black text-slate-900">₺{totalEstimatedCost.toFixed(2)}</p>
                 </div>
                 <button 
                   onClick={handleCreateOrder}
                   disabled={isReadonly}
                   className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                 >
                   {isDirectEntry ? 'STOKLARA İŞLE' : 'SİPARİŞİ ONAYLA'} ({Object.keys(cart).length})
                 </button>
               </div>
             )}
          </div>
        </div>

        {filteredLowStock.length > 0 && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-red-50/50 p-6 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-xl text-red-600">
                  <TrendingDown size={24} />
                </div>
                <div>
                  <h3 className="font-black text-red-900 text-lg">Acil Sipariş Paneli</h3>
                  <p className="text-xs text-red-600 font-bold">Kritik seviyenin altına düşen ürünler</p>
                </div>
              </div>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {filteredLowStock.length} KRİTİK ÜRÜN
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Ürün Adı</th>
                    <th className="px-6 py-4 text-center">Mevcut Stok</th>
                    <th className="px-6 py-4 text-center">Önerilen Sipariş</th>
                    <th className="px-6 py-4 text-right">Tahmini Tutar</th>
                    <th className="px-6 py-4 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLowStock.map(item => {
                    const suggested = getSuggestedAmount(item);
                    const inCart = cart[item.id];
                    return (
                      <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.category}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg font-black text-xs whitespace-nowrap">
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl font-black text-xs border border-indigo-100">
                            {suggested} {item.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">
                          ₺{(suggested * item.costPerUnit).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {inCart ? (
                            <button 
                              disabled={isReadonly} 
                              onClick={() => {
                                const newCart = {...cart};
                                delete newCart[item.id];
                                setCart(newCart);
                              }} 
                              className="text-red-500 font-black text-xs hover:underline disabled:opacity-30 uppercase tracking-tighter"
                            >
                              İptal
                            </button>
                          ) : (
                            <button 
                              disabled={isReadonly}
                              onClick={() => handleAddToCart(item.id, suggested)}
                              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                              SEPETE EKLE
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                <ListFilter size={24} />
              </div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Ürün Kataloğu</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tüm Stok Kayıtları</span>
          </div>
          
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left">
               <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 sticky top-0 z-10">
                 <tr>
                   <th className="px-6 py-4">Ürün Detayı</th>
                   <th className="px-6 py-4 text-center">Stok Durumu</th>
                   <th className="px-6 py-4 text-right">Birim Fiyat</th>
                   <th className="px-6 py-4 w-56">Sipariş Miktarı</th>
                   <th className="px-6 py-4 text-center">Ekleme</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                 {filteredAllItems.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                       <div className="flex flex-col items-center gap-3 opacity-50">
                         <Search size={48} />
                         <p className="font-bold">Aramanızla eşleşen hiçbir ürün bulunamadı.</p>
                       </div>
                     </td>
                   </tr>
                 ) : (
                   filteredAllItems.map(item => {
                     const inCart = cart[item.id];
                     const isCritical = item.quantity <= item.minLevel;
                     return (
                       <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-6 py-4">
                           <p className="font-bold text-slate-800">{item.name}</p>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{item.category}</p>
                         </td>
                         <td className="px-6 py-4 text-center">
                           <div className="flex flex-col items-center gap-1">
                             <span className={`px-2 py-1 rounded-lg font-black text-xs ${isCritical ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                               {item.quantity} {item.unit}
                             </span>
                             {item.quantity === 0 && <span className="text-[8px] text-red-500 font-black uppercase tracking-widest">STOK TÜKENDİ</span>}
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right font-bold text-slate-600">
                           ₺{item.costPerUnit.toFixed(2)}
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <input 
                               type="number" 
                               min="0"
                               step="0.01"
                               placeholder="Miktar"
                               disabled={isReadonly}
                               id={`qty-${item.id}`}
                               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center text-slate-800"
                             />
                             <span className="text-[10px] font-black text-slate-400 w-8">{item.unit}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            {inCart ? (
                                <button 
                                  disabled={isReadonly} 
                                  onClick={() => {
                                    const newCart = {...cart};
                                    delete newCart[item.id];
                                    setCart(newCart);
                                  }} 
                                  className="text-red-500 text-[10px] font-black border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-30 transition-all uppercase"
                                >
                                  ÇIKAR
                                </button>
                              ) : (
                                <button 
                                  disabled={isReadonly}
                                  onClick={() => {
                                    const input = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                                    const val = parseFloat(input.value);
                                    if(val > 0) {
                                      handleAddToCart(item.id, val);
                                      input.value = ""; 
                                    } else {
                                      handleAddToCart(item.id, getSuggestedAmount(item));
                                    }
                                  }}
                                  className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-4 py-2 rounded-xl hover:bg-indigo-100 disabled:opacity-30 transition-all shadow-sm active:scale-95 uppercase tracking-tighter"
                                >
                                  EKLE
                                </button>
                              )}
                         </td>
                       </tr>
                     )
                   })
                 )}
               </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400">
             <History size={64} className="mb-4 opacity-10"/>
             <p className="font-bold">Henüz kaydedilmiş bir sipariş veya depo girişi bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.slice().reverse().map(order => (
              <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-all group">
                 <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                       <PackageCheck size={24} />
                     </div>
                     <div>
                       <div className="flex items-center gap-3">
                         <h3 className="font-black text-slate-800 text-lg">İşlem #{order.id.substr(-4)}</h3>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                           {order.status === 'COMPLETED' ? 'TAMAMLANDI' : 'BEKLİYOR'}
                         </span>
                       </div>
                       <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                         <div className="flex items-center gap-1"><Clock size={12}/> {new Date(order.date).toLocaleString()}</div>
                         <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                         <div className="flex items-center gap-1 uppercase">{order.createdBy}</div>
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Toplam Maliyet</p>
                     <p className="text-xl font-black text-slate-900 tracking-tight">₺{(order.totalEstimatedCost || 0).toFixed(2)}</p>
                   </div>
                 </div>

                 <div className="bg-slate-50/50 rounded-2xl p-4 mb-6 border border-slate-100">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 px-1">Sipariş İçeriği</p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                     {order.items.map((item, idx) => {
                       const invItem = inventory.find(i => i.id === item.inventoryItemId);
                       return (
                         <div key={idx} className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100 text-sm">
                           <span className="font-bold text-slate-700 truncate mr-2">{invItem?.name || 'Silinmiş Ürün'}</span>
                           <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg text-xs whitespace-nowrap">
                             {item.orderQuantity} {invItem?.unit || ''}
                           </span>
                         </div>
                       )
                     })}
                   </div>
                 </div>

                 {order.status === 'PENDING' && (
                   <div className="flex justify-end pt-2">
                     <button 
                       disabled={isReadonly}
                       onClick={() => onReceiveOrder && onReceiveOrder(order.id)}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                     >
                       <PackageCheck size={20} />
                       MAL KABULÜ YAP (STOKLARA EKLE)
                     </button>
                   </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <ShoppingBag className="text-indigo-600" />
            Satın Alma & Lojistik
          </h2>
          <p className="text-slate-500 font-medium">Depo girişleri ve tedarik yönetimi merkezi.</p>
        </div>
        
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm">
          <button 
            onClick={() => { setActiveTab('NEW'); setSearchTerm(""); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'NEW' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            YENİ GİRİŞ
          </button>
          <button 
            onClick={() => { setActiveTab('HISTORY'); setSearchTerm(""); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            GEÇMİŞ & MAL KABUL
          </button>
        </div>
      </div>

      {activeTab === 'NEW' ? renderNewOrder() : renderHistory()}
    </div>
  );
};
