
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { LicenseActivation } from './components/LicenseActivation'; 
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Recipes } from './components/Recipes';
import { Sales } from './components/Sales';
import { SalesCalendar } from './components/SalesCalendar';
import { Counting } from './components/Counting';
import { Reports } from './components/Reports';
import { Purchasing } from './components/Purchasing';
import { Settings } from './components/Settings';
import { ImportExport } from './components/ImportExport';
import { InventoryItem, Recipe, Sale, ViewState, Log, StockMovement, CountSession, StockMovementType, Role, Order, User, LicenseData, Unit, Category } from './types';
import { INITIAL_INVENTORY, INITIAL_RECIPES, INITIAL_USERS } from './constants';
import { verifyLicenseKey, checkRemoteLicenseStatus } from './services/licenseService';
import { Hotel } from 'lucide-react';

/**
 * Gelişmiş Kalıcı Durum Kancası
 * Verinin yüklendiğini (isLoaded) dışarıya aktarır.
 */
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean, string | null] {
  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (window.ipcRenderer) {
        try {
          const result = await window.ipcRenderer.invoke('get-data', key);
          if (result && result.error) {
            if (result.error === 'INVALID_JSON') {
              setError(`'${key}' dosyası bozulmuş (Geçersiz JSON). Veri kaybını önlemek için otomatik kayıt durduruldu.`);
            } else if (result.error !== 'FILE_NOT_FOUND') {
              setError(`'${key}' yüklenirken hata oluştu: ${result.error}`);
            }
          } else if (result && result.data !== null && result.data !== undefined) {
            setState(result.data);
          }
        } catch (err) {
          console.error(`Error loading ${key}:`, err);
          setError(`'${key}' yüklenirken beklenmedik hata.`);
        }
      } else {
        const saved = localStorage.getItem(key);
        if (saved) {
          try { 
            setState(JSON.parse(saved)); 
          } catch (e) {
            setError(`'${key}' verisi bozulmuş.`);
          }
        }
      }
      setIsLoaded(true);
    };

    loadData();
  }, [key]);

  useEffect(() => {
    if (isLoaded && !error) {
      if (window.ipcRenderer) {
        window.ipcRenderer.send('save-data', key, state);
      } else {
        localStorage.setItem(key, JSON.stringify(state));
      }
    }
  }, [key, state, isLoaded, error]);

  return [state, setState, isLoaded, error];
}

const DEFAULT_CATEGORIES: string[] = [];

const App: React.FC = () => {
  // Lisans durumu ve yüklenme kontrolü
  const [license, setLicense, isLicenseLoaded, licenseError] = usePersistentState<LicenseData | null>('license', null);
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [licenseExpired, setLicenseExpired] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [users, setUsers, isUsersLoaded, usersError] = usePersistentState<User[]>('users', INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  
  const [inventory, setInventory, isInventoryLoaded, inventoryError] = usePersistentState<InventoryItem[]>('inventory', INITIAL_INVENTORY);
  const [categories, setCategories, isCategoriesLoaded, categoriesError] = usePersistentState<string[]>('categories', DEFAULT_CATEGORIES);
  const [recipes, setRecipes, isRecipesLoaded, recipesError] = usePersistentState<Recipe[]>('recipes', INITIAL_RECIPES);
  const [sales, setSales, isSalesLoaded, salesError] = usePersistentState<Sale[]>('sales', []);
  const [logs, setLogs, isLogsLoaded, logsError] = usePersistentState<Log[]>('logs', []);
  const [movements, setMovements, isMovementsLoaded, movementsError] = usePersistentState<StockMovement[]>('movements', []);
  const [countSessions, setCountSessions, isCountsLoaded, countsError] = usePersistentState<CountSession[]>('countSessions', []);
  const [orders, setOrders, isOrdersLoaded, ordersError] = usePersistentState<Order[]>('orders', []);
  const [reportEmails, setReportEmails, isEmailsLoaded, emailsError] = usePersistentState<string[]>('reportEmails', []);

  const allErrors = [
    licenseError, usersError, inventoryError, categoriesError, recipesError, 
    salesError, logsError, movementsError, countsError, ordersError, emailsError
  ].filter(Boolean) as string[];

  const handleUpdateLicense = useCallback((newKey: string) => {
    if (!license?.machineId) {
      // Makine ID yoksa, yeni bir ID ile doğrula
      window.ipcRenderer?.invoke('get-machine-id').then(mId => {
         const result = verifyLicenseKey(mId, newKey);
         if (result.isValid && !result.isExpired) {
           const newLicense: LicenseData = {
              key: newKey,
              machineId: mId,
              activatedAt: Date.now(),
              clientName: 'Yönetici',
              expirationDate: result.expirationDate || 0
           };
           setLicense(newLicense);
           setIsLicensed(true);
           setLicenseExpired(false);
         }
      });
      return true;
    }
    const result = verifyLicenseKey(license.machineId, newKey);
    if (result.isValid && !result.isExpired) {
      const newLicense: LicenseData = {
        ...license,
        key: newKey,
        expirationDate: result.expirationDate || 0
      };
      setLicense(newLicense);
      setIsLicensed(true);
      setLicenseExpired(false);
      return true;
    }
    return false;
  }, [license, setLicense]);

  /**
   * Lisans Durumunu Kontrol Et
   * Kritik: Sadece veri diskten yüklendikten sonra (isLicenseLoaded) karar verir.
   */
  useEffect(() => {
    const performLicenseCheck = async () => {
      // Disk verisi henüz gelmediyse kontrol yapma, bekle.
      if (!isLicenseLoaded) return; 

      if (license && license.key && license.machineId) {
        const result = verifyLicenseKey(license.machineId, license.key);
        
        // Eğer yerel anahtar geçersizse bir de uzak sunucuya sor (Otomatik Yenileme)
        if (!result.isValid || result.isExpired) {
          setIsSyncing(true);
          const remoteKey = await checkRemoteLicenseStatus(license.machineId);
          if (remoteKey) {
            const remoteResult = verifyLicenseKey(license.machineId, remoteKey);
            if (remoteResult.isValid && !remoteResult.isExpired) {
              handleUpdateLicense(remoteKey);
              setIsSyncing(false);
              setLicenseChecked(true);
              return;
            }
          }
          setIsSyncing(false);
        }

        setIsLicensed(result.isValid);
        setLicenseExpired(result.isExpired || false);
      } else {
        // Lisans verisi yoksa direkt aktivasyona
        setIsLicensed(false);
      }
      setLicenseChecked(true);
    };

    performLicenseCheck();
  }, [license, isLicenseLoaded, handleUpdateLicense]);

  // Oturum yönetimi
  useEffect(() => {
    if (!isUsersLoaded) return;
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const exists = users.find(u => u.id === parsedUser.id);
        if (exists) setCurrentUser(exists);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, [users, isUsersLoaded]);

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('currentUser'); };
  const handleLogin = (u: User) => { setCurrentUser(u); localStorage.setItem('currentUser', JSON.stringify(u)); };

  const handleUpdateRole = (userId: string, newRole: Role) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleUpdateProfile = (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const handleBatchAddInventory = (newItems: Omit<InventoryItem, 'id'>[]) => {
    const itemsWithIds = newItems.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9) }));
    setInventory(prev => [...prev, ...itemsWithIds]);
  };

  const handleBatchAddRecipes = (newRecipes: Omit<Recipe, 'id'>[]) => {
    const recipesWithIds = newRecipes.map(recipe => ({ ...recipe, id: Math.random().toString(36).substr(2, 9), lastUpdated: Date.now() }));
    setRecipes(prev => [...prev, ...recipesWithIds]);
  };

  const handleCreateOrder = (items: { inventoryItemId: string; orderQuantity: number; costPerUnit: number }[], isDirectEntry: boolean, customTimestamp?: number) => {
    if (licenseExpired) return;

    const totalCost = items.reduce((acc, curr) => acc + (curr.orderQuantity * curr.costPerUnit), 0);
    const newOrder: Order = {
      id: Date.now().toString(),
      date: customTimestamp || Date.now(),
      status: isDirectEntry ? 'COMPLETED' : 'PENDING',
      items,
      totalEstimatedCost: totalCost,
      createdBy: currentUser?.name || 'Sistem'
    };

    setOrders(prev => [...prev, newOrder]);

    if (isDirectEntry) {
      setInventory(prev => prev.map(invItem => {
        const orderItem = items.find(oi => oi.inventoryItemId === invItem.id);
        if (orderItem) {
          return { ...invItem, quantity: invItem.quantity + orderItem.orderQuantity };
        }
        return invItem;
      }));
    }
  };

  const handleReceiveOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'COMPLETED') return;

    setInventory(prev => prev.map(invItem => {
      const orderItem = order.items.find(oi => oi.inventoryItemId === invItem.id);
      if (orderItem) {
        return { ...invItem, quantity: invItem.quantity + orderItem.orderQuantity };
      }
      return invItem;
    }));

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'COMPLETED' } : o));
  };

  const handleMakeSale = (recipeId: string, quantity: number, staffName: string, customTimestamp?: number) => {
    if (licenseExpired) return;
    
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const newSale: Sale = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      recipeId,
      quantity,
      totalPrice: recipe.price * quantity,
      timestamp: customTimestamp || Date.now(),
      staffName
    };
    setSales(prev => [...prev, newSale]);

    setInventory(prevInventory => {
      const updatedInventory = [...prevInventory];
      
      recipe.ingredients.forEach(ingredient => {
        const itemIndex = updatedInventory.findIndex(i => i.id === ingredient.inventoryItemId);
        if (itemIndex > -1) {
          const item = updatedInventory[itemIndex];
          let deduction = ingredient.amount * quantity;
          
          if (ingredient.unit === Unit.GRAM && item.unit === Unit.KG) deduction *= 0.001;
          else if (ingredient.unit === Unit.MILLILITER && item.unit === Unit.LITER) deduction *= 0.001;
          else if (ingredient.unit === Unit.CL && item.unit === Unit.LITER) deduction *= 0.01;
          else if (ingredient.unit === Unit.KG && item.unit === Unit.GRAM) deduction *= 1000;
          
          updatedInventory[itemIndex] = {
            ...item,
            quantity: Math.max(0, item.quantity - deduction)
          };
        }
      });
      
      return updatedInventory;
    });
  };

  const handleStockAction = (itemId: string, type: StockMovementType, amount: number, reason: string, customTimestamp?: number) => {
    if (licenseExpired) return;
    
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: item.quantity - amount };
      }
      return item;
    }));

    const newMovement: StockMovement = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      inventoryItemId: itemId,
      type,
      amount,
      reason,
      timestamp: customTimestamp || Date.now(),
      staffName: currentUser?.name || 'Sistem'
    };
    setMovements(prev => [...prev, newMovement]);
  };

  const handleSaveCount = (session: CountSession) => {
    if (licenseExpired) return;
    setCountSessions(prev => [...prev, session]);
    
    setInventory(prevInventory => {
      return prevInventory.map(invItem => {
        const countedItem = session.items.find(si => si.inventoryItemId === invItem.id);
        if (countedItem) {
          return { ...invItem, quantity: countedItem.countedQuantity, lastCountDate: session.date };
        }
        return invItem;
      });
    });
  };

  // Bekleme Ekranı: Tüm veriler (özellikle lisans) diskten yüklenene kadar gösterilir.
  if (!isLicenseLoaded || !licenseChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8 space-y-4">
        <div className="bg-indigo-600 p-5 rounded-[2.5rem] animate-bounce shadow-2xl shadow-indigo-500/40">
          <Hotel size={56} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter">OtelPro Hazırlanıyor</h1>
          <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.3em] mt-2 animate-pulse">Veri Bağlantısı Kuruluyor</p>
        </div>
      </div>
    );
  }

  // Lisans Aktivasyon Ekranı
  if (!isLicensed) {
    return (
      <LicenseActivation 
        onSuccess={(k, m) => { 
          const result = verifyLicenseKey(m, k);
          const newLicense: LicenseData = { 
            key: k, 
            machineId: m, 
            activatedAt: Date.now(), 
            clientName: 'Yönetici', 
            expirationDate: result.expirationDate || (Date.now() + 31536000000) 
          };
          setLicense(newLicense);
          setIsLicensed(true);
        }} 
      />
    );
  }

  // Giriş Ekranı
  if (!currentUser) {
    return (
      <Login 
        users={users} 
        onLogin={handleLogin} 
        onRegister={(u) => setUsers([...users, {...u, id: Date.now().toString(), role: Role.PENDING}])} 
        onResetPassword={(id, p) => setUsers(users.map(u => u.id === id ? {...u, password: p} : u))} 
      />
    );
  }

  // Ana Uygulama
  return (
    <Layout currentView={view} onChangeView={setView} currentUser={currentUser} onLogout={handleLogout} licenseExpired={licenseExpired}>
      {allErrors.length > 0 && (
        <div className="bg-red-600 text-white p-4 mb-6 rounded-2xl shadow-lg animate-pulse flex flex-col gap-2">
          <div className="flex items-center gap-2 font-black uppercase tracking-widest text-sm">
            <Hotel size={20} />
            Kritik Veri Hatası Tespit Edildi!
          </div>
          <div className="text-xs font-medium opacity-90">
            {allErrors.map((err, i) => <p key={i}>• {err}</p>)}
          </div>
          <p className="text-[10px] font-black uppercase mt-2 bg-white/20 p-2 rounded-lg">
            UYARI: Dosyalarınız bozulmuş olabilir. Veri kaybını önlemek için sistem bu dosyaları kaydetmeyi durdurdu. 
            Lütfen Belgelerim/OtelStokVerileri klasöründeki dosyaları kontrol edin veya yedeğinizi geri yükleyin.
          </p>
        </div>
      )}
      {view === 'dashboard' && <Dashboard inventory={inventory} sales={sales} logs={logs} recipes={recipes} />}
      {view === 'inventory' && <Inventory inventory={inventory} categories={categories} onAddItem={(i) => setInventory([...inventory, {...i, id: Date.now().toString()}])} onUpdateItem={(id, u) => setInventory(inventory.map(i => i.id === id ? {...i, ...u} : i))} onDeleteItem={(id) => setInventory(inventory.filter(i => i.id !== id))} onStockAction={handleStockAction} onAddCategory={(n) => setCategories([...categories, n])} onDeleteCategory={(n) => setCategories(categories.filter(c => c !== n))} isReadonly={licenseExpired} />}
      {view === 'recipes' && <Recipes recipes={recipes} inventory={inventory} categories={categories} onAddRecipe={(r) => setRecipes([...recipes, {...r, id: Date.now().toString()}])} onUpdateRecipe={(id, r) => setRecipes(recipes.map(rec => rec.id === id ? {...rec, ...r} : rec))} onDeleteRecipe={(id) => setRecipes(recipes.filter(r => r.id !== id))} isReadonly={licenseExpired} />}
      {view === 'sales' && <Sales recipes={recipes} onMakeSale={handleMakeSale} isReadonly={licenseExpired} />}
      {view === 'sales-calendar' && <SalesCalendar sales={sales} recipes={recipes} />}
      {view === 'counting' && <Counting inventory={inventory} onSaveCount={handleSaveCount} isReadonly={licenseExpired} />}
      {view === 'purchasing' && <Purchasing inventory={inventory} userRole={currentUser.role} orders={orders} onCreateOrder={handleCreateOrder} onReceiveOrder={handleReceiveOrder} isReadonly={licenseExpired} />}
      {view === 'reports' && <Reports countSessions={countSessions} movements={movements} inventory={inventory} sales={sales} recipes={recipes} />}
      {['settings', 'report-settings'].includes(view) && <Settings currentView={view} users={users} inventory={inventory} sales={sales} countSessions={countSessions} reportEmails={reportEmails} onUpdateEmails={setReportEmails} onUpdateRole={handleUpdateRole} onDeleteUser={handleDeleteUser} onUpdateProfile={handleUpdateProfile} onUpdateLicense={handleUpdateLicense} currentUser={currentUser} licenseData={license} isReadonly={licenseExpired} />}
      {view === 'import-export' && <ImportExport inventory={inventory} onBatchAddInventory={handleBatchAddInventory} onBatchAddRecipes={handleBatchAddRecipes} isReadonly={licenseExpired} />}
    </Layout>
  );
};

export default App;
