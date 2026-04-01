
import React, { useState, useEffect } from 'react';
import { Recipe, InventoryItem, Unit, Category } from '../types';
import { generateRecipeSuggestion } from '../services/geminiService';
import { ChefHat, Plus, Wand2, Trash2, Save, Loader2, Edit2, X, Scale, Search, Hash } from 'lucide-react';

interface RecipesProps {
  recipes: Recipe[];
  inventory: InventoryItem[];
  categories: string[];
  onAddRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  onUpdateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  onDeleteRecipe: (id: string) => void;
  isReadonly?: boolean;
}

export const Recipes: React.FC<RecipesProps> = ({ recipes, inventory, categories, onAddRecipe, onUpdateRecipe, onDeleteRecipe, isReadonly = false }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipePrice, setNewRecipePrice] = useState(0);
  const [newRecipeDesc, setNewRecipeDesc] = useState("");
  const [newRecipeCategory, setNewRecipeCategory] = useState<string>(categories[0] || "Gıda");
  const [newRecipeTolerance, setNewRecipeTolerance] = useState(5);
  const [tempIngredients, setTempIngredients] = useState<{inventoryItemId: string, amount: number, unit: Unit}[]>([]);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedItemUnit, setSelectedItemUnit] = useState<Unit>(Unit.KG);
  const [ingAmount, setIngAmount] = useState<string>("");

  useEffect(() => {
    if (!newRecipeCategory && categories.length > 0) {
      setNewRecipeCategory(categories[0]);
    }
  }, [categories]);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetModal = () => {
    setNewRecipeName("");
    setNewRecipePrice(0);
    setNewRecipeDesc("");
    setNewRecipeCategory(categories[0] || "Gıda");
    setNewRecipeTolerance(5);
    setTempIngredients([]);
    setEditingId(null);
    setIsCreating(false);
    setSelectedItemId("");
    setIngAmount("");
  };

  const handleEditOpen = (recipe: Recipe) => {
    if (isReadonly) return;
    setEditingId(recipe.id);
    setNewRecipeName(recipe.name);
    setNewRecipePrice(recipe.price);
    setNewRecipeDesc(recipe.description || "");
    setNewRecipeCategory(recipe.category);
    setNewRecipeTolerance(recipe.tolerancePercentage);
    setTempIngredients([...recipe.ingredients]);
    setIsCreating(true);
  };

  const handleAiGenerate = async () => {
    if (isReadonly || !newRecipeName) return;
    setIsAiLoading(true);
    try {
      const inventoryListStr = inventory.map(i => i.name).join(", ");
      const suggestion = await generateRecipeSuggestion(newRecipeName, inventoryListStr);
      if (suggestion) {
        setNewRecipeDesc(suggestion.description);
        setNewRecipePrice(suggestion.suggestedPrice || 0);
        const matchedIngredients = suggestion.ingredients.map((ing: any) => {
          const invItem = inventory.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
          return invItem ? { inventoryItemId: invItem.id, amount: ing.amount, unit: ing.unit as Unit } : null;
        }).filter((i: any) => i !== null);
        setTempIngredients(matchedIngredients);
      }
    } catch (e) { alert("Hata oluştu."); } finally { setIsAiLoading(false); }
  };

  const handleSaveRecipe = () => {
    if (isReadonly) return;
    if (!newRecipeName || tempIngredients.length === 0) return;
    
    const recipeData = { 
      name: newRecipeName, 
      price: newRecipePrice, 
      description: newRecipeDesc, 
      ingredients: tempIngredients, 
      category: newRecipeCategory, 
      tolerancePercentage: newRecipeTolerance 
    };

    if (editingId) {
      onUpdateRecipe(editingId, recipeData);
    } else {
      onAddRecipe(recipeData);
    }
    resetModal();
  };

  const getCompatibleUnits = (baseUnit: Unit): Unit[] => {
    const weightUnits = [Unit.KG, Unit.GRAM];
    const volumeUnits = [Unit.LITER, Unit.MILLILITER, Unit.CL];
    if (weightUnits.includes(baseUnit)) return weightUnits;
    if (volumeUnits.includes(baseUnit)) return volumeUnits;
    return [baseUnit]; 
  };

  const handleItemSelect = (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
      setSelectedItemId(id);
      setSelectedItemUnit(item.unit);
    }
  };

  const handleAddTempIngredient = () => {
    const item = inventory.find(i => i.id === selectedItemId);
    const amountVal = parseFloat(ingAmount);
    if (item && amountVal > 0) {
      setTempIngredients([...tempIngredients, { 
        inventoryItemId: item.id, 
        amount: amountVal, 
        unit: selectedItemUnit 
      }]);
      setSelectedItemId("");
      setIngAmount("");
    }
  };

  const calculateCost = (recipe: Recipe) => {
    return recipe.ingredients.reduce((total, ing) => {
      const item = inventory.find(i => i.id === ing.inventoryItemId);
      if (!item) return total;
      let factor = 1;
      if (ing.unit === Unit.GRAM && item.unit === Unit.KG) factor = 0.001;
      else if (ing.unit === Unit.KG && item.unit === Unit.GRAM) factor = 1000;
      else if (ing.unit === Unit.MILLILITER && item.unit === Unit.LITER) factor = 0.001;
      else if (ing.unit === Unit.CL && item.unit === Unit.LITER) factor = 0.01;
      else if (ing.unit === Unit.LITER && item.unit === Unit.MILLILITER) factor = 1000;
      return total + (item.costPerUnit * ing.amount * factor);
    }, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
               <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <ChefHat className="text-indigo-600"/> 
                 {editingId ? 'Reçeteyi Düzenle' : 'Yeni Reçete'}
               </h3>
               <button onClick={resetModal} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Ürün / Reçete Adı</label>
                    <div className="flex gap-2">
                      <input type="text" value={newRecipeName} onChange={e => setNewRecipeName(e.target.value)} className="flex-1 px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 font-semibold bg-white text-slate-900" placeholder="Örn: Mojito"/>
                      <button onClick={handleAiGenerate} disabled={isAiLoading || !newRecipeName || isReadonly} className="bg-purple-600 disabled:opacity-50 text-white px-5 rounded-xl flex items-center gap-2 text-xs font-black shadow-lg shadow-purple-100 transition-all active:scale-95">
                        {isAiLoading ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16} />} AI DESTEĞİ
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">Kategori</label>
                      <select value={newRecipeCategory} onChange={e => setNewRecipeCategory(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl bg-white outline-none font-semibold text-slate-900">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-1">Tolerans (±%)</label>
                      <input type="number" value={newRecipeTolerance} onChange={e => setNewRecipeTolerance(parseFloat(e.target.value))} className="w-full px-4 py-2.5 border rounded-xl outline-none font-bold text-slate-900"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Satış Fiyatı (₺)</label>
                    <input type="number" value={newRecipePrice} onChange={e => setNewRecipePrice(parseFloat(e.target.value))} className="w-full px-4 py-2.5 border rounded-xl outline-none font-black text-indigo-600 text-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Hazırlanış / Notlar</label>
                    <textarea value={newRecipeDesc} onChange={e => setNewRecipeDesc(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl min-h-[120px] outline-none text-slate-800 font-medium" placeholder="Hazırlanış adımlarını buraya yazabilirsiniz..."/>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col">
                  <h4 className="font-black text-slate-800 text-sm mb-4 flex justify-between items-center uppercase tracking-widest">
                    İçerik Malzemeleri 
                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg">{tempIngredients.length} KALEM</span>
                  </h4>
                  
                  <div className="space-y-3 mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex gap-2">
                      <select 
                        value={selectedItemId}
                        onChange={(e) => handleItemSelect(e.target.value)}
                        className="flex-1 text-sm border rounded-xl px-3 py-2.5 bg-white outline-none focus:border-indigo-500 font-semibold text-slate-900"
                      >
                        <option value="">Malzeme Seç...</option>
                        {inventory
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
                          .map(i => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({i.quantity} {i.unit})
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    {selectedItemId && (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <div className="relative flex-1">
                          <input 
                            type="number" 
                            step="0.001" 
                            placeholder="Miktar" 
                            value={ingAmount}
                            onChange={(e) => setIngAmount(e.target.value)}
                            className="w-full text-sm border rounded-xl pl-3 pr-10 py-2.5 outline-none focus:border-indigo-500 font-bold text-slate-900 bg-white"
                          />
                        </div>
                        
                        <select 
                          value={selectedItemUnit}
                          onChange={(e) => setSelectedItemUnit(e.target.value as Unit)}
                          className="w-24 text-sm border rounded-xl px-2 bg-slate-50 outline-none font-black text-slate-700"
                        >
                          {getCompatibleUnits(inventory.find(i => i.id === selectedItemId)?.unit || Unit.KG).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        
                        <button 
                          onClick={handleAddTempIngredient}
                          className="bg-indigo-600 text-white px-5 rounded-xl text-xs font-black hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                        >
                          EKLE
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 custom-scrollbar">
                    {tempIngredients.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <Scale size={32} className="mb-2 opacity-20"/>
                        <p className="text-xs font-bold">Henüz malzeme eklenmedi.</p>
                      </div>
                    ) : (
                      tempIngredients.map((ing, idx) => {
                        const invItem = inventory.find(i => i.id === ing.inventoryItemId);
                        return (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 text-sm group hover:border-indigo-200 transition-colors">
                            <div>
                              <p className="font-bold text-slate-800">{invItem?.name || 'Bilinmeyen'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-xs">{ing.amount} {ing.unit}</span>
                              <button onClick={() => setTempIngredients(tempIngredients.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {tempIngredients.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahmini Reçete Maliyeti:</span>
                      <span className="font-black text-lg text-slate-900 tracking-tighter">₺{calculateCost({ ingredients: tempIngredients } as Recipe).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                 <button onClick={resetModal} className="px-8 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-500 transition-all">İptal</button>
                 <button onClick={handleSaveRecipe} disabled={isReadonly} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-2.5 rounded-xl disabled:opacity-50 font-black shadow-xl shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95">
                   <Save size={18}/> {editingId ? 'DEĞİŞİKLİKLERİ KAYDET' : 'REÇETEYİ OLUŞTUR'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <ChefHat className="text-indigo-600" /> Reçete Kataloğu
          </h2>
          <p className="text-slate-500 font-medium">Satış ürünlerinizin maliyet ve teknik dökümleri.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)} 
          disabled={isReadonly} 
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all font-black disabled:opacity-50 active:scale-95"
        >
          <Plus size={20} /> Yeni Reçete Ekle
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        {/* Kategori Filtreleme */}
        <div className="p-6 border-b flex flex-wrap gap-2 bg-slate-50/30">
            <button 
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${selectedCategory === "ALL" ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'}`}
            >
              TÜMÜ
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
        </div>

        {/* Arama Çubuğu */}
        <div className="p-6 border-b flex items-center gap-4 bg-white">
          <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400">
            <Search size={22} />
          </div>
          <input 
            type="text" 
            placeholder="Reçete adı ile hızlıca ara..." 
            className="flex-1 outline-none text-slate-900 font-bold bg-transparent text-lg placeholder:text-slate-300" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold">Aradığınız kriterlere uygun reçete bulunamadı.</p>
              </div>
            ) : (
              filteredRecipes.map(recipe => {
                const cost = calculateCost(recipe);
                const profit = recipe.price - cost;
                const margin = recipe.price > 0 ? (profit / recipe.price) * 100 : 0;

                return (
                  <div key={recipe.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-7 flex flex-col group hover:shadow-xl hover:border-indigo-100 transition-all relative">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex-1 pr-4">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-1">{recipe.name}</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-500 border border-indigo-100/50">
                          <Hash size={10} /> {recipe.category}
                        </span>
                      </div>
                      <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          disabled={isReadonly} 
                          onClick={() => handleEditOpen(recipe)} 
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-30"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          disabled={isReadonly} 
                          onClick={() => onDeleteRecipe(recipe.id)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Birim Maliyet:</span>
                        <span className="font-black text-slate-700">₺{cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-tighter">Satış Fiyatı:</span>
                        <span className="font-black text-indigo-600 text-base tracking-tighter">₺{recipe.price.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Kâr Marjı:</span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${margin > 50 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          %{margin.toFixed(0)} MARJ
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto">
                       <p className="text-[11px] text-slate-400 line-clamp-2 italic font-medium leading-relaxed">
                         {recipe.description || "Bu reçete için henüz hazırlık notu eklenmemiş."}
                       </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
