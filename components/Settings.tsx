
import React, { useState, useEffect } from 'react';
import { User, Role, LicenseData, InventoryItem, Sale, CountSession, ViewState, CompanyStamp } from '../types';
import { Settings as SettingsIcon, Trash2, Shield, AlertTriangle, X, UserCog, Save, BadgeCheck, Copy, CheckCircle, Mail, Send, Loader2, MailCheck, ExternalLink, Users, Download, Info, Activity, FileText, Stamp, Building2, CheckCircle2, UserPlus, Search, KeyRound, Eye, EyeOff, UserCheck, ShieldAlert } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";
import { UISettings } from './UISettings';

interface SettingsProps {
  users: User[];
  inventory: InventoryItem[];
  sales: Sale[];
  countSessions: CountSession[];
  reportEmails: string[];
  onUpdateEmails: (emails: string[]) => void;
  onUpdateRole: (userId: string, newRole: Role) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser?: (user: Omit<User, 'id'>) => void;
  onUpdateProfile: (userId: string, updates: Partial<User>) => void;
  onUpdateLicense?: (newKey: string) => boolean;
  currentUser: User;
  licenseData?: LicenseData | null;
  isReadonly?: boolean;
  currentView?: ViewState;
  companyStamp?: CompanyStamp;
  onUpdateCompanyStamp?: (stamp: CompanyStamp) => void;
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
  onUpdateEmails, onUpdateRole, onDeleteUser, onAddUser, onUpdateProfile, onUpdateLicense, 
  currentUser, licenseData, isReadonly = false, currentView = 'settings',
  companyStamp, onUpdateCompanyStamp
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newQuestion, setNewQuestion] = useState(currentUser.securityQuestion || SECURITY_QUESTIONS[0]);
  const [newAnswer, setNewAnswer] = useState("");
  const [newLicenseKey, setNewLicenseKey] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const [stampData, setStampData] = useState<CompanyStamp>({
    businessName: companyStamp?.businessName || 'OtelPro',
    legalTitle: companyStamp?.legalTitle || '',
    taxOffice: companyStamp?.taxOffice || '',
    taxNumber: companyStamp?.taxNumber || '',
    address: companyStamp?.address || '',
    phone: companyStamp?.phone || '',
    email: companyStamp?.email || '',
    authorizedPerson: companyStamp?.authorizedPerson || '',
    stampNote: companyStamp?.stampNote || ''
  });
  const [stampSavedNotice, setStampSavedNotice] = useState(false);

  // Yeni Üye Ekleme State'leri
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<Role>(Role.WAITER);
  const [newUserSecurityQuestion, setNewUserSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [newUserSecurityAnswer, setNewUserSecurityAnswer] = useState("");
  const [userAddError, setUserAddError] = useState<string | null>(null);
  const [userAddSuccess, setUserAddSuccess] = useState<string | null>(null);

  // Üye Listesi Arama / Filtreleme
  const [searchMember, setSearchMember] = useState("");

  // Üye Şifresini Yönetici Olarak Güncelleme
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [adminResetNewPass, setAdminResetNewPass] = useState("");
  const [showAdminResetPass, setShowAdminResetPass] = useState(false);
  const [resetPassSuccess, setResetPassSuccess] = useState(false);
  const [resetPassError, setResetPassError] = useState<string | null>(null);

  useEffect(() => {
    if (companyStamp) {
      setStampData({
        businessName: companyStamp.businessName || '',
        legalTitle: companyStamp.legalTitle || '',
        taxOffice: companyStamp.taxOffice || '',
        taxNumber: companyStamp.taxNumber || '',
        address: companyStamp.address || '',
        phone: companyStamp.phone || '',
        email: companyStamp.email || '',
        authorizedPerson: companyStamp.authorizedPerson || '',
        stampNote: companyStamp.stampNote || ''
      });
    }
  }, [companyStamp]);

  const handleSaveStamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadonly) return;
    if (onUpdateCompanyStamp) {
      onUpdateCompanyStamp(stampData);
      setStampSavedNotice(true);
      setTimeout(() => setStampSavedNotice(false), 3000);
    }
  };

  const appDisplayName = stampData.businessName?.trim() || companyStamp?.businessName?.trim() || "OtelPro";

  const isReportView = currentView === 'report-settings';
  const isStampView = currentView === 'stamp-settings';
  const isUIView = currentView === 'ui-settings';

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
    doc.setFontSize(22);
    doc.text(trClean(`${appDisplayName.toUpperCase()} DENETIM VE ANALIZ RAPORU`), 20, 35);
    doc.setFontSize(10);
    doc.text(trClean(`OLUSTURMA: ${timestamp} | YONETICI: ${currentUser.name}`), 20, 46);
    if (stampData.legalTitle || stampData.taxNumber) {
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(trClean(`${stampData.legalTitle || ''} ${stampData.taxOffice ? '| VD: ' + stampData.taxOffice : ''} ${stampData.taxNumber ? '| VN: ' + stampData.taxNumber : ''}`), 20, 54);
    }

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
      doc.text(trClean(`${appDisplayName} Kurumsal Raporu - Sayfa ${i}/${pages}`), 105, 290, { align: 'center' });
    }

    return doc;
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const doc = await prepareFullReport();
      const safeFileName = appDisplayName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`${safeFileName}_Analiz_Raporu_${Date.now()}.pdf`);
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
      const safeFileName = appDisplayName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`${safeFileName}_Gonderilecek_Rapor.pdf`);

      // 2. Outlook/Varsayılan Mail İstemcisini Aç
      const recipients = reportEmails.join(',');
      const subject = encodeURIComponent(`${appDisplayName} İşletme Analiz Raporu`);
      const body = encodeURIComponent(
        `Sayın Yetkili,\n\n${appDisplayName} işletmesine ait güncel depo ve satış analiz raporu oluşturulmuştur. Pdfiniz ektedir. İyi çalışmalar dileriz.\n\n\nTarih: ${new Date().toLocaleString('tr-TR')}\n${appDisplayName} Yönetim Sistemi`
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

  const generateRandomPassword = () => {
    const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
    let pass = "";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(pass);
    setShowNewUserPassword(true);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAddError(null);

    const trimmedName = newUserName.trim();
    const trimmedUsername = newUserUsername.trim().toLowerCase();
    const trimmedPassword = newUserPassword.trim();

    if (!trimmedName) {
      setUserAddError("Lütfen personelin adını ve soyadını girin.");
      return;
    }

    if (!trimmedUsername) {
      setUserAddError("Lütfen bir kullanıcı adı belirleyin.");
      return;
    }

    if (trimmedUsername.length < 3) {
      setUserAddError("Kullanıcı adı en az 3 karakter olmalıdır.");
      return;
    }

    // Benzersiz kullanıcı adı kontrolü
    const isTaken = users.some(u => u.username.toLowerCase() === trimmedUsername);
    if (isTaken) {
      setUserAddError(`"${trimmedUsername}" kullanıcı adı zaten kayıtlı. Lütfen farklı bir kullanıcı adı seçin.`);
      return;
    }

    if (!trimmedPassword) {
      setUserAddError("Lütfen personele bir giriş şifresi tanımlayın.");
      return;
    }

    if (trimmedPassword.length < 4) {
      setUserAddError("Şifre en az 4 karakter olmalıdır.");
      return;
    }

    if (onAddUser) {
      onAddUser({
        name: trimmedName,
        username: trimmedUsername,
        password: trimmedPassword,
        role: newUserRole,
        securityQuestion: newUserSecurityQuestion || SECURITY_QUESTIONS[0],
        securityAnswer: newUserSecurityAnswer.trim().toLowerCase() || 'otel'
      });
    }

    setUserAddSuccess(`"${trimmedName}" personeli (${newUserRole}) olarak başarıyla eklendi.`);
    setShowAddUserModal(false);
    setNewUserName("");
    setNewUserUsername("");
    setNewUserPassword("");
    setNewUserSecurityAnswer("");
    setShowNewUserPassword(false);
    setTimeout(() => setUserAddSuccess(null), 4000);
  };

  const handleDeleteMemberConfirm = (user: User) => {
    if (user.id === currentUser.id) {
      alert("Kendi oturum açmış hesabınızı silemezsiniz.");
      return;
    }
    if (window.confirm(`"${user.name}" (${user.username}) isimli personeli silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      onDeleteUser(user.id);
    }
  };

  const handleAdminResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    if (!adminResetNewPass.trim() || adminResetNewPass.trim().length < 4) {
      setResetPassError("Şifre en az 4 karakter olmalıdır.");
      return;
    }
    onUpdateProfile(resetPassUser.id, { password: adminResetNewPass.trim() });
    setResetPassSuccess(true);
    setResetPassError(null);
    setTimeout(() => {
      setResetPassSuccess(false);
      setShowAdminResetPass(false);
      setResetPassUser(null);
      setAdminResetNewPass("");
    }, 1500);
  };

  if (isUIView) {
    return <UISettings isReadonly={isReadonly} />;
  }

  if (isStampView) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
              <Stamp className="text-indigo-600" size={28} /> Kaşe Bilgisi
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              İşletme resmi kaşe ve ticari bilgilerinizi buradan yönetebilirsiniz. 
              Tanımladığınız işletme adı programın ana ismi olarak kullanılır.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200">
            <Building2 size={15} />
            Program İsmi & Resmi Kaşe
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon: Kaşe ve İşletme Formu */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-200">
                    <Stamp size={20}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">İşletme ve Kaşe Bilgileri</h3>
                    <p className="text-xs text-slate-500 font-medium">Resmi evrak ve raporlarda yer alacak bilgiler</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveStamp} className="p-6 md:p-8 space-y-6">
                {/* Bilgi Kutusu */}
                <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                  <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    <strong className="font-bold text-indigo-900">Program İsmi Değişimi: </strong>
                    Aşağıdaki <span className="underline decoration-indigo-400 font-bold">İşletme / Firma Adı</span> alanına yazdığınız isim, 
                    programın sol menüsündeki logosunda, giriş ekranında ve raporlarda <strong>"OtelPro"</strong> ibaresinin yerine geçer.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                          İşletme / Firma Adı (Program Başlığı) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Program İsmi Olur
                        </span>
                      </div>
                      <input 
                        type="text" 
                        required
                        value={stampData.businessName} 
                        onChange={e => setStampData({...stampData, businessName: e.target.value})} 
                        placeholder="Örn: Grand Hotel & Restoran veya Çınar Cafe" 
                        className="w-full px-4 py-3 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl outline-none font-bold text-slate-800 bg-white transition-all shadow-sm text-base"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Resmi Ticari Unvan</label>
                      <input 
                        type="text" 
                        value={stampData.legalTitle || ''} 
                        onChange={e => setStampData({...stampData, legalTitle: e.target.value})} 
                        placeholder="Örn: ABC Turizm Otelcilik Tic. Ltd. Şti." 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Yetkili / İmza Sahibi</label>
                      <input 
                        type="text" 
                        value={stampData.authorizedPerson || ''} 
                        onChange={e => setStampData({...stampData, authorizedPerson: e.target.value})} 
                        placeholder="Örn: Ahmet Yılmaz" 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vergi Dairesi</label>
                      <input 
                        type="text" 
                        value={stampData.taxOffice || ''} 
                        onChange={e => setStampData({...stampData, taxOffice: e.target.value})} 
                        placeholder="Örn: Kadıköy V.D." 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vergi No / MERSİS No</label>
                      <input 
                        type="text" 
                        value={stampData.taxNumber || ''} 
                        onChange={e => setStampData({...stampData, taxNumber: e.target.value})} 
                        placeholder="Örn: 1234567890" 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Telefon / İletişim</label>
                      <input 
                        type="text" 
                        value={stampData.phone || ''} 
                        onChange={e => setStampData({...stampData, phone: e.target.value})} 
                        placeholder="Örn: 0212 444 0 123" 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">E-Posta Adresi</label>
                      <input 
                        type="email" 
                        value={stampData.email || ''} 
                        onChange={e => setStampData({...stampData, email: e.target.value})} 
                        placeholder="Örn: info@isletme.com" 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                   </div>

                   <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">İşletme Açık Adresi</label>
                      <textarea 
                        rows={2}
                        value={stampData.address || ''} 
                        onChange={e => setStampData({...stampData, address: e.target.value})} 
                        placeholder="Örn: Sahil Cad. No:45 Beşiktaş / İstanbul" 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm resize-none"
                      />
                   </div>

                   <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kaşe Notu / Ek Bilgi (İsteğe Bağlı)</label>
                      <input 
                        type="text" 
                        value={stampData.stampNote || ''} 
                        onChange={e => setStampData({...stampData, stampNote: e.target.value})} 
                        placeholder="Örn: Ticaret Sicil No: 123456 / Mersis: 0123456789" 
                        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:border-indigo-500 text-sm"
                      />
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                   <div>
                     {stampSavedNotice && (
                       <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-2 rounded-lg border border-emerald-200 animate-fade-in">
                         <CheckCircle2 size={16} /> Kaşe bilgileri kaydedildi ve program ismi güncellendi!
                       </span>
                     )}
                   </div>
                   <button 
                     type="submit" 
                     disabled={isReadonly}
                     className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                   >
                     <Save size={18} /> Kaşe Bilgilerini Kaydet
                   </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sağ Kolon: Canlı Kaşe ve Bilgilendirme */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Stamp size={16} className="text-indigo-600" />
                  Canlı Dijital Kaşe
                </h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  Önizleme
                </span>
              </div>

              <div className="relative border-2 border-dashed border-indigo-400/80 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/60 p-6 rounded-2xl text-center select-none shadow-inner overflow-hidden">
                 <div className="absolute top-2 right-3 text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-white/90 px-2 py-0.5 rounded-full border border-indigo-100 shadow-xs">
                   DİJİTAL KAŞE
                 </div>
                 <div className="space-y-1.5 text-indigo-950 font-serif">
                    <h4 className="text-base font-black tracking-wider uppercase text-indigo-900 font-sans leading-tight">
                      {stampData.businessName?.trim() || 'İŞLETME / FİRMA ADI'}
                    </h4>
                    {stampData.legalTitle && (
                      <p className="text-xs font-bold text-indigo-800">
                        {stampData.legalTitle}
                      </p>
                    )}
                    <div className="text-[11px] text-indigo-700/90 font-sans font-medium space-y-1 pt-1 border-t border-indigo-200/50">
                      {(stampData.taxOffice || stampData.taxNumber) && (
                        <p>
                          {stampData.taxOffice ? `${stampData.taxOffice} V.D.` : ''} {stampData.taxNumber ? `| V.No: ${stampData.taxNumber}` : ''}
                        </p>
                      )}
                      {stampData.address && (
                        <p className="text-[10px] text-slate-600 leading-tight">{stampData.address}</p>
                      )}
                      <p className="text-[10px]">
                        {stampData.phone ? `Tel: ${stampData.phone}` : ''} 
                        {stampData.email ? ` | ${stampData.email}` : ''} 
                      </p>
                      {stampData.authorizedPerson && (
                        <p className="text-[10px] font-bold text-indigo-900">
                          Yetkili: {stampData.authorizedPerson}
                        </p>
                      )}
                      {stampData.stampNote && (
                        <p className="text-[9px] text-indigo-500 italic">{stampData.stampNote}</p>
                      )}
                    </div>
                 </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Bu kaşe görünümü sistem raporlarında ve resmi evraklarda kullanılır.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Building2 size={18} />
                <span>Program İsmi Değişimi</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                İşletme adınızı kaydettiğinizde aşağıdaki alanlar anında güncellenir:
              </p>
              <ul className="text-xs text-slate-400 space-y-2 pt-1 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Sol menüdeki ana logo ve başlık
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Kullanıcı giriş ekranı başlığı
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Tarayıcı sekme başlığı
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Oluşturulan PDF denetim ve analiz raporları
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
             <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <Users size={20} className="text-indigo-600"/> Personel & Üye Yönetimi
                 </h3>
                 <p className="text-xs text-slate-500 mt-0.5">
                   Sistemde kayıtlı toplam <span className="font-semibold text-slate-700">{users.length}</span> personel bulunmaktadır
                 </p>
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                 <div className="relative flex-1 sm:flex-initial">
                   <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                   <input 
                     type="text" 
                     placeholder="İsim, kullanıcı adı ara..." 
                     value={searchMember}
                     onChange={e => setSearchMember(e.target.value)}
                     className="w-full sm:w-52 pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all"
                   />
                 </div>

                 <button
                   type="button"
                   disabled={isReadonly}
                   onClick={() => {
                     setUserAddError(null);
                     setNewUserName("");
                     setNewUserUsername("");
                     setNewUserPassword("");
                     setNewUserSecurityAnswer("");
                     setShowNewUserPassword(false);
                     setShowAddUserModal(true);
                   }}
                   className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                 >
                   <UserPlus size={16} /> Yeni Üye Ekle
                 </button>
               </div>
             </div>

             {userAddSuccess && (
               <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-fade-in">
                 <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                 <span>{userAddSuccess}</span>
               </div>
             )}

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                   <tr>
                     <th className="px-6 py-4">Personel</th>
                     <th className="px-6 py-4">Kullanıcı Adı</th>
                     <th className="px-6 py-4">Yetki / Rol</th>
                     <th className="px-6 py-4 text-center">İşlemler</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {users
                     .filter(u => {
                       if (!searchMember.trim()) return true;
                       const q = searchMember.toLowerCase().trim();
                       return (
                         u.name.toLowerCase().includes(q) ||
                         u.username.toLowerCase().includes(q) ||
                         u.role.toLowerCase().includes(q)
                       );
                     })
                     .map(user => {
                       const isCurrent = user.id === currentUser.id;
                       return (
                         <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shadow-xs">
                                 {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                               </div>
                               <div>
                                 <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                   {user.name}
                                   {isCurrent && (
                                     <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                       Siz
                                     </span>
                                   )}
                                 </div>
                               </div>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <span className="text-slate-600 font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">
                               @{user.username}
                             </span>
                           </td>
                           <td className="px-6 py-4">
                              <select 
                                value={user.role}
                                disabled={isReadonly || isCurrent}
                                onChange={(e) => onUpdateRole(user.id, e.target.value as Role)}
                                className={`border rounded-xl px-3 py-1.5 text-xs font-semibold outline-none transition-all ${
                                  user.role === Role.ADMIN 
                                    ? 'bg-purple-50 border-purple-200 text-purple-700 focus:border-purple-400'
                                    : user.role === Role.CHEF 
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 focus:border-amber-400'
                                    : user.role === Role.BAR_MANAGER 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 focus:border-blue-400'
                                    : user.role === Role.WAITER 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:border-emerald-400'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-slate-400'
                                }`}
                              >
                                {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                              </select>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  title="Şifreyi Değiştir / Sıfırla"
                                  onClick={() => {
                                    setResetPassUser(user);
                                    setAdminResetNewPass("");
                                    setResetPassError(null);
                                    setResetPassSuccess(false);
                                    setShowAdminResetPass(true);
                                  }}
                                  className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                                >
                                  <KeyRound size={17} />
                                </button>
                                {!isCurrent && (
                                  <button 
                                    type="button"
                                    title="Personeli Sil"
                                    onClick={() => handleDeleteMemberConfirm(user)} 
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={17} />
                                  </button>
                                )}
                              </div>
                           </td>
                         </tr>
                       );
                     })}
                 </tbody>
               </table>
               {users.length === 0 && (
                 <div className="p-8 text-center text-slate-400 text-xs font-medium">
                   Henüz sisteme eklenmiş bir personel bulunmuyor.
                 </div>
               )}
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

      {/* Yeni Üye Ekle Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Yeni Üye / Personel Ekle</h3>
                  <p className="text-xs text-slate-500">Sisteme erişebilecek yeni personel hesabı oluşturun</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-6 space-y-4">
              {userAddError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertTriangle size={16} className="shrink-0 text-red-500" />
                  <span>{userAddError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Kullanıcı Adı (Giriş için) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={e => setNewUserUsername(e.target.value.replace(/\s+/g, ''))}
                    placeholder="ahmetyilmaz"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Giriş yaparken kullanılır. Boşluk içermez.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Giriş Şifresi <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    Rastgele Şifre Üret
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewUserPassword ? "text" : "password"}
                    required
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="En az 4 karakter"
                    className="w-full px-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  >
                    {showNewUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Yetki / Görev Rolü <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as Role)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                >
                  <option value={Role.ADMIN}>Yönetici (Tam Yetkili)</option>
                  <option value={Role.CHEF}>Mutfak Şefi</option>
                  <option value={Role.BAR_MANAGER}>Bar Şefi</option>
                  <option value={Role.WAITER}>Garson</option>
                  <option value={Role.PENDING}>Onay Bekliyor</option>
                </select>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                  {newUserRole === Role.ADMIN && "👑 Yönetici: Stok, reçeteler, satışlar, sayımlar, raporlar ve tüm sistem ayarlarına tam erişim hakkına sahiptir."}
                  {newUserRole === Role.CHEF && "👨‍🍳 Mutfak Şefi: Reçeteleri inceleme/oluşturma, stok hareketlerini takip etme ve sipariş yönetimine erişebilir."}
                  {newUserRole === Role.BAR_MANAGER && "🍸 Bar Şefi: Bar stokları, içecek reçeteleri ve satış hareketlerine erişebilir."}
                  {newUserRole === Role.WAITER && "🍽️ Garson: Yalnızca adisyon, masa siparişleri ve hızlı satış terminaline erişebilir."}
                  {newUserRole === Role.PENDING && "⏳ Onay Bekliyor: Yönetici onay verene kadar sisteme giriş yapamaz."}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Güvenlik Sorusu (Şifre kurtarma için)
                  </label>
                  <select
                    value={newUserSecurityQuestion}
                    onChange={e => setNewUserSecurityQuestion(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Güvenlik Sorusu Cevabı
                  </label>
                  <input
                    type="text"
                    value={newUserSecurityAnswer}
                    onChange={e => setNewUserSecurityAnswer(e.target.value)}
                    placeholder="Cevap girin (varsayılan: otel)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  <UserCheck size={16} /> Personeli Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yönetici Şifre Sıfırlama Modal */}
      {showAdminResetPass && resetPassUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Personel Şifresini Belirle</h3>
                  <p className="text-xs text-slate-500">{resetPassUser.name} (@{resetPassUser.username})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowAdminResetPass(false); setResetPassUser(null); }}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminResetPasswordSubmit} className="p-6 space-y-4">
              {resetPassSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Şifre başarıyla güncellendi!
                </div>
              )}
              {resetPassError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" />
                  {resetPassError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Yeni Şifre Belirleyin
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={adminResetNewPass}
                  onChange={e => setAdminResetNewPass(e.target.value)}
                  placeholder="Yeni şifre girin (en az 4 karakter)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAdminResetPass(false); setResetPassUser(null); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
