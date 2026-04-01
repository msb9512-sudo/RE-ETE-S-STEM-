
import React, { useRef, useState } from 'react';
import { InventoryItem, Recipe, Category, Unit } from '../types';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Database, FileText, X } from 'lucide-react';

interface ImportExportProps {
  inventory: InventoryItem[];
  onBatchAddInventory: (items: Omit<InventoryItem, 'id'>[]) => void;
  onBatchAddRecipes: (recipes: Omit<Recipe, 'id'>[]) => void;
  isReadonly?: boolean;
}

export const ImportExport: React.FC<ImportExportProps> = ({ inventory, onBatchAddInventory, onBatchAddRecipes, isReadonly = false }) => {
  const fileInputInventory = useRef<HTMLInputElement>(null);
  const fileInputRecipes = useRef<HTMLInputElement>(null);
  const [log, setLog] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  const parseNumber = (val: any): number => {
    if (val === undefined || val === null) return 0;
    let str = val.toString().trim();
    let cleanVal = str.replace(/[^0-9.,-]/g, '');
    if (!cleanVal) return 0;
    if (cleanVal.includes(',') && !cleanVal.includes('.')) {
      cleanVal = cleanVal.replace(',', '.');
    } else if (cleanVal.includes(',') && cleanVal.includes('.')) {
      cleanVal = cleanVal.replace(/\./g, '').replace(',', '.');
    }
    const num = parseFloat(cleanVal);
    return isNaN(num) ? 0 : num;
  };

  const downloadInventoryTemplate = () => {
    const content = "sep=;\nUrun Adi;Kategori (Gıda/İçecek/Alkol/Temizlik/Diğer);Miktar;Birim (kg/lt/adet/gr/ml/cl);Kritik Seviye;Birim Maliyet\nOrnek Urun 1;Gıda;10;kg;5;25,50\nOrnek Urun 2;Alkol;500;cl;100;12,00";
    downloadFile(content, "depo_sablonu.csv");
  };

  const downloadRecipeTemplate = () => {
    const content = "sep=;\nRecete Adi;Kategori (Gıda/Bar);Satis Fiyati;Miktar;Birim;Malzeme Adi\nOrnek Yemek;Gıda;180;2;AD;Ornek Urun 1\nOrnek Kokteyl;Bar;250;5;CL;Ornek Urun 2";
    downloadFile(content, "recete_sablonu.csv");
  };

  const downloadFile = (content: string, fileName: string) => {
    const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([BOM, content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const parseInventoryCSV = (text: string) => {
    if (isReadonly) return;
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0 && !l.toLowerCase().startsWith('sep='));
    const newItems: Omit<InventoryItem, 'id'>[] = [];
    let successCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length < 2) continue;
      try {
        const item: Omit<InventoryItem, 'id'> = {
          name: cols[0]?.trim() || "Bilinmeyen Ürün",
          category: validateCategory(cols[1]?.trim()),
          quantity: parseNumber(cols[2]),
          unit: validateUnit(cols[3]?.trim()),
          minLevel: parseNumber(cols[4]),
          costPerUnit: parseNumber(cols[5])
        };
        if (item.name) {
          newItems.push(item);
          successCount++;
        }
      } catch (e) { console.error(e); }
    }
    if (newItems.length > 0) {
      onBatchAddInventory(newItems);
      setLog({ msg: `${successCount} ürün depoya başarıyla aktarıldı.`, type: 'success' });
    } else setLog({ msg: "Geçerli veri bulunamadı.", type: 'error' });
  };

  const parseRecipeCSV = (text: string) => {
    if (isReadonly) return;
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0 && !l.toLowerCase().startsWith('sep='));
    const recipeMap = new Map<string, Omit<Recipe, 'id'>>();
    let missingIngredients: string[] = [];
    
    // Normalizasyon fonksiyonu (eşleştirme için)
    const normalize = (s: string) => s.trim().toLocaleLowerCase('tr-TR');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length < 6) continue;
      
      const recipeName = cols[0]?.trim();
      const ingredientName = cols[5]?.trim();
      if (!recipeName || !ingredientName) continue;

      const matchedInv = inventory.find(inv => normalize(inv.name) === normalize(ingredientName));
      
      if (!recipeMap.has(recipeName)) {
        recipeMap.set(recipeName, {
          name: recipeName, 
          category: validateCategory(cols[1]), 
          price: parseNumber(cols[2]),
          description: 'Toplu aktarıldı', 
          ingredients: [], 
          tolerancePercentage: 5
        });
      }
      
      if (matchedInv) {
        recipeMap.get(recipeName)!.ingredients.push({ 
          inventoryItemId: matchedInv.id, 
          amount: parseNumber(cols[3]), 
          unit: validateUnit(cols[4]) 
        });
      } else {
        if (!missingIngredients.includes(ingredientName)) missingIngredients.push(ingredientName);
      }
    }

    const finalRecipes = Array.from(recipeMap.values()).filter(r => r.ingredients.length > 0);
    
    if (finalRecipes.length > 0) {
      onBatchAddRecipes(finalRecipes);
      if (missingIngredients.length > 0) {
        setLog({ 
          msg: `${finalRecipes.length} reçete aktarıldı. Ancak şu malzemeler depoda bulunamadığı için eklenemedi: ${missingIngredients.join(", ")}`, 
          type: 'info' 
        });
      } else {
        setLog({ msg: `${finalRecipes.length} reçete başarıyla aktarıldı.`, type: 'success' });
      }
    } else {
      setLog({ msg: "Hiçbir reçete aktarılamadı. Malzeme isimlerinin depodakilerle tam eşleştiğinden emin olun.", type: 'error' });
    }
  };

  // Fix: Category is a type alias for string, so return literal strings instead of property access
  const validateCategory = (val: string): Category => {
    const v = val?.toLocaleLowerCase('tr-TR') || '';
    if (v.includes('gıda') || v.includes('mutfak')) return 'Gıda';
    if (v.includes('alkol') || v.includes('bar')) return 'Alkol';
    if (v.includes('içecek')) return 'İçecek';
    if (v.includes('temizlik')) return 'Temizlik';
    return 'Gıda';
  };

  const validateUnit = (val: string): Unit => {
    const v = val?.toLocaleLowerCase('tr-TR') || '';
    if (v.includes('kg')) return Unit.KG;
    if (v.includes('lt')) return Unit.LITER;
    if (v.includes('cl')) return Unit.CL;
    if (v.includes('ml')) return Unit.MILLILITER;
    if (v.includes('gr')) return Unit.GRAM;
    if (v.includes('ad')) return Unit.PIECE;
    return Unit.PIECE;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'inventory' | 'recipes') => {
    if (isReadonly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      let text = '';
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(buffer));
      } catch (err) {
        text = new TextDecoder('windows-1254').decode(new Uint8Array(buffer));
      }
      if (type === 'inventory') parseInventoryCSV(text); else parseRecipeCSV(text);
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Database className="text-indigo-600" size={32} />
        <h2 className="text-2xl font-bold text-slate-800">Veri İçe / Dışa Aktar</h2>
      </div>

      {log && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${log.type === 'success' ? 'bg-green-100 text-green-700' : log.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'} border shadow-lg`}>
           {log.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
           <div className="flex-1"><p className="text-sm">{log.msg}</p></div>
           <button onClick={() => setLog(null)}><X size={20}/></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${isReadonly ? 'opacity-60 grayscale-[0.5]' : ''}`}>
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileSpreadsheet size={20} className="text-blue-500"/> Depo Envanteri</h3>
           <button onClick={downloadInventoryTemplate} className="w-full border py-3 rounded-xl mb-4 text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"><Download size={16}/> Şablon</button>
           <div 
             className={`border-2 border-dashed rounded-xl p-8 text-center ${isReadonly ? 'cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-blue-50'}`} 
             onClick={() => !isReadonly && fileInputInventory.current?.click()}
           >
             <Upload className="mx-auto text-slate-400 mb-2" size={32} />
             <p className="text-xs text-slate-500">Envanter CSV dosyasını seçin</p>
             <input type="file" ref={fileInputInventory} accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'inventory')} disabled={isReadonly} />
           </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${isReadonly ? 'opacity-60 grayscale-[0.5]' : ''}`}>
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-purple-500"/> Teknik Reçeteler</h3>
           <button onClick={downloadRecipeTemplate} className="w-full border py-3 rounded-xl mb-4 text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"><Download size={16}/> Şablon</button>
           <div 
             className={`border-2 border-dashed rounded-xl p-8 text-center ${isReadonly ? 'cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-purple-50'}`} 
             onClick={() => !isReadonly && fileInputRecipes.current?.click()}
           >
             <Upload className="mx-auto text-slate-400 mb-2" size={32} />
             <p className="text-xs text-slate-500">Reçete CSV dosyasını seçin</p>
             <input type="file" ref={fileInputRecipes} accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, 'recipes')} disabled={isReadonly} />
           </div>
        </div>
      </div>
    </div>
  );
};
