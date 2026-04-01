
import React, { useState } from 'react';
import { User, Role, LicenseData, InventoryItem, Sale, CountSession, ViewState } from '../types';
import { Settings as SettingsIcon, Trash2, Shield, AlertTriangle, X, UserCog, Save, BadgeCheck, Copy, CheckCircle, Mail, Send, Loader2, MailCheck, ExternalLink, Users, Download, Info, Activity, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";

interface SettingsProps {
  users: User[];
  inventory: InventoryItem[];
  sales: Sale[];
  countSessions: CountSession[];
  reportEmails: string[];
  onUpdateEmails: (emails: string[]) => void;
  onUpdateRole: (userId: string, newRole: Role) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateProfile: (userId: string, updates: Partial<User>) => void;
  onUpdateLicense?: (newKey: string) => boolean;
  currentUser: User;
  licenseData?: LicenseData | null;
  isReadonly?: boolean;
  currentView?: ViewState;
}

const SECURITY_QUESTIONS = [
  "İlk evcil hayvanınızın adı nedir?",
  "Doğduğunuz şehir neresidir?",
  "Annenizin kızlık soyadı nedir?",
  "İlkokul öğretmeninizin adı nedir?",
  "En sevdiğiniz yemek nedir?"
];

// PDF Türkçe Karakter Temizleyici (Karakter hatalarını önlemek için)
const trClean = (text: string) => {
  if (!text) return "";
  return text.toString()
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/₺/g, 'TL'); // TL simgesini metin olarak değiştir
};

export const Settings: React.FC<SettingsProps> = ({ 
  users, inventory, sales, countSessions, reportEmails = [], 
  onUpdateEmails, onUpdateRole, onDeleteUser, onUpdateProfile, onUpdateLicense, 
  currentUser, licenseData, isReadonly = false, currentView = 'settings'
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newQuestion, setNewQuestion] = useState(currentUser.securityQuestion || SECURITY_QUESTIONS[0]);
  const [newAnswer, setNewAnswer] = useState("");
  const [newLicenseKey, setNewLicenseKey] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const isReportView = currentView === 'report-settings';

  const prepareFullReport = async () => {
    const totalRev = sales.reduce((a, s) => a + s.totalPrice, 0);
    const stockVal = inventory.reduce((a, i) => a + (i.quantity * i.costPerUnit), 0);
    const totalVariance = countSessions.reduce((acc, s) => 
      acc + s.items.reduce((sa, i) => sa + (i.varianceCost || 0), 0), 0);

    let aiSummary = "Isletme verileri analiz edildi. Stok seviyeleri ve satis trendleri kontrol edilmistir.";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summaryResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Sen profesyonel bir otel denetçisisin. 
          Veriler - Ciro: ${totalRev} TL, Stok: ${stockVal} TL, Sayim Farki: ${totalVariance} TL. 
          Bu verileri yorumlayan ve isletme sahibine tavsiyeler veren 1 paragraflik profesyonel bir yonetici ozeti yaz.`,
      });
      aiSummary = summaryResponse.text || aiSummary;
    } catch (e) { console.error("AI Error"); }

    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('tr-TR');
    
    // KAPAK
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.text(trClean("OTELPRO ISLETME DENETIM RAPORU"), 20, 35);
    doc.setFontSize(10);
    doc.text(trClean(`OLUSTURMA: ${timestamp} | YONETICI: ${currentUser.name}`), 20, 48);

    // AI ÖZETİ
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(trClean("YONETICI OZETI (AI ANALIZI)"), 20, 75);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(trClean(aiSummary), 170);
    doc.text(splitSummary, 20, 85);

    // KPI TABLOSU
    autoTable(doc, {
      startY: 120,
      head: [[trClean('FINANSAL GOSTERGE'), trClean('DURUM / DEGER')]],
      body: [
        [trClean('Donemlik Toplam Ciro'), `${totalRev.toLocaleString()} TL`],
        [trClean('Guncel Stok Varligi (Maliyet)'), `${stockVal.toLocaleString()} TL`],
        [trClean('Net Sayim Kaybi/Kazanci'), `${totalVariance.toLocaleString()} TL`],
        [trClean('Kritik Stoktaki Urun Sayisi'), `${inventory.filter(i => i.quantity <= i.minLevel).length} Adet`]
      ],
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 10, cellPadding: 6 }
    });

    // ENVANTER LİSTESİ
    doc.addPage();
    doc.setFontSize(16);
    doc.text(trClean("DETAYLI DEPO ENVANTER LISTESI"), 20, 20);
    autoTable(doc, {
      startY: 30,
      head: [[trClean('URUN ADI'), trClean('KATEGORI'), trClean('MIKTAR'), trClean('BIRIM MALIYET'), trClean('TOPLAM')]],
      body: inventory.map(item => [
        trClean(item.name),
        trClean(item.category),
        `${item.quantity} ${item.unit}`,
        `${item.costPerUnit.toFixed(2)} TL`,
        `${(item.quantity * item.costPerUnit).toFixed(2)} TL`
      ]),
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 }
    });

    // SAYIM ANALİZİ
    doc.addPage();
    doc.setFontSize(16);
    doc.text(trClean("SON SAYIM VE FARK ANALIZI"), 20, 20);
    if (countSessions.length > 0) {
      const last = countSessions[countSessions.length - 1];
      autoTable(doc, {
        startY: 35,
        head: [[trClean('URUN'), trClean('SISTEM'), trClean('SAYILAN'), trClean('FARK'), trClean('MALIYET ETKISI')]],
        body: last.items.map(item => {
          const inv = inventory.find(i => i.id === item.inventoryItemId);
          return [
            trClean(inv?.name || "Bilinmeyen"),
            item.systemQuantity,
            item.countedQuantity,
            item.variance,
            `${item.varianceCost.toFixed(2)} TL`
          ];
        }),
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 8 }
      });
    }

    const pages = doc.getNumberOfPages();
    for(let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(trClean(`OtelPro Kurumsal Raporu - Sayfa ${i}/${pages}`), 105, 290, { align: 'center' });
    }

    return doc;
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const doc = await prepareFullReport();
      doc.save(`OtelPro_Analiz_Raporu_${Date.now()}.pdf`);
    } catch (err) {
      alert("Hata: " + err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Outlook/Mail açan mailto fonksiyonu
  const handleSendReport = async () => {
    if (reportEmails.length === 0) {
      alert("Lütfen önce bir alıcı e-posta adresi ekleyin.");
      return;
    }
    
    setIsGeneratingReport(true);
    try {
      // 1. Önce PDF'i indir
      const doc = await prepareFullReport();
      doc.save(`OtelPro_Gonderilecek_Rapor.pdf`);

      // 2. Outlook/Varsayılan Mail İstemcisini Aç
      const recipients = reportEmails.join(',');
      const subject = encodeURIComponent("OtelPro İşletme Analiz Raporu");
      const body = encodeURIComponent(
        `Sayın Yönetici,\n\nİşletmenizin güncel depo ve satış analiz raporu oluşturulmuştur. Pdfiniz ektedir. İyi Çalışmalar dilerim.\n\n\nTarih: ${new Date().toLocaleString('tr-TR')}\nOtelPro Otomasyon Sistemi`
      );

      window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`;
      
    } catch (err) {
      alert("İşlem sırasında bir hata oluştu.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadonly) return;
    const updates: Partial<User> = {
      securityQuestion: newQuestion,
      securityAnswer: newAnswer ? newAnswer.toLowerCase().trim() : currentUser.securityAnswer
    };
    if (newPassword) updates.password = newPassword;
    onUpdateProfile(currentUser.id, updates);
    setNewPassword("");
    setNewAnswer("");
    alert("Profil bilgileri başarıyla güncellendi.");
  };

  if (isReportView) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MailCheck className="text-indigo-600" /> Raporlama Merkezi
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-12 text-center space-y-8 relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                <div className="bg-indigo-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-200">
                  <Activity className="text-white" size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">OtelPro Analitik Raporu</h3>
                  <p className="text-slate-500 max-w-md mx-auto mt-3 font-medium text-lg leading-relaxed">
                    Stoklar ve sayım farklarını içeren tam kapsamlı belge.
                  </p>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <button 
                    onClick={generateReport}
                    disabled={isGeneratingReport || isReadonly}
                    className="w-full sm:w-64 bg-slate-900 hover:bg-black text-white px-8 py-5 rounded-[2rem] font-black shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingReport ? <Loader2 size={24} className="animate-spin" /> : <Download size={24} />}
                    {isGeneratingReport ? 'Hazırlanıyor...' : 'Raporu İndir'}
                  </button>

                  <button 
                    onClick={handleSendReport}
                    disabled={isGeneratingReport || isReadonly}
                    className="w-full sm:w-64 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-[2rem] font-black shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send size={24} />
                    {isGeneratingReport ? 'Hazırlanıyor...' : 'Outlook/Mail Aç'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-bold">* Raporu Gönder dediğinizde Outlook uygulamanız otomatik olarak açılacaktır.</p>
             </div>

             <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Mail size={24}/></div>
                      <h4 className="font-black text-slate-800 text-xl tracking-tight">E-Posta Alıcıları</h4>
                   </div>
                   <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{reportEmails.length} KAYITLI</span>
                </div>
                <div className="p-8 space-y-6">
                   <div className="flex gap-3">
                      <input 
                        type="email" 
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="yonetici@otelpro.com" 
                        className="flex-1 px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all"
                      />
                      <button 
                        onClick={() => { if(newEmail.includes('@')){ onUpdateEmails([...reportEmails, newEmail]); setNewEmail(""); } }} 
                        className="bg-slate-900 text-white px-8 rounded-2xl font-black hover:bg-black transition-all"
                      >
                        EKLE
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      {reportEmails.map(email => (
                        <div key={email} className="group bg-white border-2 border-slate-100 hover:border-indigo-100 px-6 py-3 rounded-2xl flex items-center gap-4 text-sm font-black text-slate-700 transition-all">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          {email}
                          <button onClick={() => onUpdateEmails(reportEmails.filter(e => e !== email))} className="text-slate-300 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
               <div className="absolute bottom-0 right-0 p-6 opacity-10"><Shield size={120} /></div>
               <h4 className="font-black text-xl flex items-center gap-3 mb-6"><Shield size={24} className="text-indigo-400"/> Gönderim Bilgisi</h4>
               <p className="text-sm text-indigo-100/60 leading-relaxed mb-4">
                 Sistemimiz tarayıcı güvenliği nedeniyle dosyayı maile otomatik ekleyemez. "Outlook/Mail Aç" butonuna tıkladıktan sonra:
               </p>
               <ul className="space-y-4">
                 <li className="flex items-start gap-4">
                   <div className="mt-1 bg-indigo-500/20 rounded-full p-2 text-indigo-400 font-bold text-[10px]">1</div>
                   <p className="text-sm text-indigo-100 font-bold">Rapor otomatik olarak iner.</p>
                 </li>
                 <li className="flex items-start gap-4">
                   <div className="mt-1 bg-indigo-500/20 rounded-full p-2 text-indigo-400 font-bold text-[10px]">2</div>
                   <p className="text-sm text-indigo-100 font-bold">Outlook uygulamanız alıcılarla birlikte açılır.</p>
                 </li>
                 <li className="flex items-start gap-4">
                   <div className="mt-1 bg-indigo-500/20 rounded-full p-2 text-indigo-400 font-bold text-[10px]">3</div>
                   <p className="text-sm text-indigo-100 font-bold">İnen dosyayı maile sürükleyin.</p>
                 </li>
               </ul>
            </div>
            
            <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
               <p className="text-xs text-amber-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={14}/> Neden 'TL' Yazıyor?</p>
               <p className="text-xs text-amber-900/60 font-medium leading-relaxed">
                 PDF fontlarının para birimi simgelerini (`₺`) her bilgisayarda doğru göstermesi için kurumsal standart olan 'TL' ibaresi kullanılmıştır.
               </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <SettingsIcon className="text-indigo-600" /> Üye ve Sistem Ayarları
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={20}/> Personel Yönetimi</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                   <tr>
                     <th className="px-6 py-4">İsim</th>
                     <th className="px-6 py-4">Kullanıcı Adı</th>
                     <th className="px-6 py-4">Yetki</th>
                     <th className="px-6 py-4 text-center">İşlem</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {users.map(user => (
                     <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4 font-medium">{user.name}</td>
                       <td className="px-6 py-4 text-slate-500 font-mono text-xs">{user.username}</td>
                       <td className="px-6 py-4">
                          <select 
                            value={user.role}
                            disabled={isReadonly || user.id === currentUser.id}
                            onChange={(e) => onUpdateRole(user.id, e.target.value as Role)}
                            className="border rounded-lg px-2 py-1 text-xs bg-white focus:border-indigo-500"
                          >
                            {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                          </select>
                       </td>
                       <td className="px-6 py-4 text-center">
                          {user.id !== currentUser.id && (
                            <button onClick={() => onDeleteUser(user.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserCog size={20}/> Profilimi Güncelle</h3>
             </div>
             <form onSubmit={handleProfileUpdate} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Yeni Şifre</label>
                   <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Boş bırakın" className="w-full px-4 py-3 border rounded-xl outline-none focus:border-indigo-500"/>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Güvenlik Sorusu</label>
                   <select value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="w-full px-4 py-3 border rounded-xl bg-white outline-none focus:border-indigo-500">
                     {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                   </select>
                </div>
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Güvenlik Cevabı</label>
                   <input type="text" value={newAnswer} onChange={e => setNewAnswer(e.target.value)} className="w-full px-4 py-3 border rounded-xl outline-none focus:border-indigo-500"/>
                </div>
                <div className="md:col-span-2 flex justify-end pt-4 border-t">
                   <button type="submit" className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 transition-all"><Save size={18} /> Profili Kaydet</button>
                </div>
             </form>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-all"><BadgeCheck size={100}/></div>
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Shield className="text-green-400" /> Lisans Bilgisi</h3>
              <div className="space-y-6 relative z-10">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-white/40 font-bold uppercase mb-2">Cihaz Kimliği</p>
                    <div className="flex items-center gap-3">
                       <code className="flex-1 truncate font-mono text-green-300 text-sm">{licenseData?.machineId || 'N/A'}</code>
                       <button onClick={() => { if(licenseData?.machineId) { navigator.clipboard.writeText(licenseData.machineId); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); } }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">{copiedId ? <CheckCircle size={16} className="text-green-400"/> : <Copy size={16}/>}</button>
                    </div>
                 </div>
                 <div className="pt-4 border-t border-white/10">
                   <form onSubmit={(e) => { e.preventDefault(); if(onUpdateLicense) onUpdateLicense(newLicenseKey); setNewLicenseKey(""); }} className="space-y-3">
                     <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Yeni Lisans Gir</label>
                     <input type="text" value={newLicenseKey} onChange={e => setNewLicenseKey(e.target.value)} placeholder="LIS-XXXX-XXXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-indigo-400" />
                     <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/50">Aktif Et</button>
                   </form>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
