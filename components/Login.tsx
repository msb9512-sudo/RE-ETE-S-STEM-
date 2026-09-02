
import React, { useState } from 'react';
import { Role, User } from '../types';
import { ShieldCheck, Lock, User as UserIcon, Hotel, Eye, EyeOff, AlertCircle, ArrowRight, HelpCircle, KeyRound, ArrowLeft, CheckCircle2, AlertTriangle, ShieldQuestion, UserCheck } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: Omit<User, 'id' | 'role'>) => void;
  onResetPassword: (userId: string, newPass: string) => void;
  appName?: string;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister, onResetPassword, appName }) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Şifremi Unuttum State'leri
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotUser, setForgotUser] = useState<User | null>(null);
  const [securityAnswerInput, setSecurityAnswerInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError("Hatalı kullanıcı adı veya şifre!");
      setPassword("");
    }
  };

  const handleFindUser = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const cleanUsername = forgotUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setForgotError("Lütfen kullanıcı adınızı girin.");
      return;
    }

    const matched = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (!matched) {
      setForgotError(`"${forgotUsername}" kullanıcı adına sahip bir personel kaydı bulunamadı. Lütfen kullanıcı adınızı kontrol edin.`);
      return;
    }

    setForgotUser(matched);
    setForgotStep(2);
    setForgotError(null);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotUser) return;

    // Güvenlik sorusu kontrolü
    const cleanAnswer = securityAnswerInput.trim().toLowerCase();
    const expectedAnswer = (forgotUser.securityAnswer || 'otel').trim().toLowerCase();

    if (!cleanAnswer) {
      setForgotError("Lütfen güvenlik sorusunun cevabını girin.");
      return;
    }

    if (cleanAnswer !== expectedAnswer) {
      setForgotError("Güvenlik sorusu cevabı eşleşmedi. Cevabı hatırlamıyorsanız, yöneticinizden (Admin) şifrenizi yenilemesini talep edebilirsiniz.");
      return;
    }

    // Şifre kontrolleri
    const trimmedNewPass = newPasswordInput.trim();
    if (!trimmedNewPass || trimmedNewPass.length < 4) {
      setForgotError("Yeni şifreniz en az 4 karakter olmalıdır.");
      return;
    }

    if (trimmedNewPass !== confirmPasswordInput.trim()) {
      setForgotError("Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    // Şifreyi kaydet
    onResetPassword(forgotUser.id, trimmedNewPass);
    setForgotSuccess(true);
  };

  const returnToLogin = () => {
    setMode('login');
    setForgotStep(1);
    setForgotUser(null);
    setSecurityAnswerInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
    setForgotError(null);
    setForgotSuccess(false);
    if (forgotUsername) {
      setUsername(forgotUsername);
    }
  };

  const displayName = appName?.trim() || "OtelPro";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="bg-indigo-600 p-4 rounded-2xl inline-block mb-4 shadow-lg shadow-indigo-500/20">
          <Hotel size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{displayName} Enterprise</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        {mode === 'login' ? (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Personel Girişi</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 font-bold flex items-center gap-2">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kullanıcı Adı</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required 
                    autoComplete="username"
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Kullanıcı adınız"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">Şifre</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotUsername(username);
                      setForgotError(null);
                      setForgotSuccess(false);
                      setForgotStep(1);
                      setForgotUser(null);
                      setMode('forgot');
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors flex items-center gap-1"
                  >
                    <KeyRound size={13} /> Şifremi Unuttum?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    autoComplete="current-password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Giriş Yap <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotUsername(username);
                  setForgotError(null);
                  setForgotSuccess(false);
                  setForgotStep(1);
                  setForgotUser(null);
                  setMode('forgot');
                }}
                className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
              >
                Giriş yapamıyor musunuz? <span className="text-indigo-600 font-bold hover:underline">Şifrenizi sıfırlayın</span>
              </button>
            </div>
          </div>
        ) : (
          /* ŞİFREMİ UNUTTUM / ŞİFRE SIFIRLAMA MODU */
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={returnToLogin}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <ArrowLeft size={16} /> Giriş Ekranına Dön
              </button>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {forgotSuccess ? "Tamamlandı" : forgotStep === 1 ? "Adım 1 / 2" : "Adım 2 / 2"}
              </span>
            </div>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <KeyRound size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Şifre Sıfırlama</h2>
              <p className="text-xs text-slate-500 mt-1">
                {forgotSuccess 
                  ? "İşlem başarıyla tamamlandı" 
                  : forgotStep === 1 
                  ? "Personel kullanıcı adınızı girerek başlayın" 
                  : "Güvenlik sorusunu yanıtlayıp yeni şifrenizi belirleyin"}
              </p>
            </div>

            {forgotError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-4 font-semibold flex items-start gap-2 border border-red-100">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Şifreniz Güncellendi!</h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Yeni şifreniz başarıyla kaydedildi. Artık yeni şifrenizi kullanarak sisteme giriş yapabilirsiniz.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={returnToLogin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  <UserCheck size={18} /> Giriş Ekranına Git
                </button>
              </div>
            ) : forgotStep === 1 ? (
              <form onSubmit={handleFindUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kullanıcı Adı
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-mono text-sm">@</span>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value.replace(/\s+/g, ''))}
                      className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="kullaniciadiniz"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Sistemde kayıtlı personel kullanıcı adınızı yazın.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  Devam Et <ArrowRight size={17} />
                </button>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
                  💡 <strong>İpucu:</strong> Kullanıcı adınızı hatırlamıyorsanız, otel yöneticinizden <em>Ayarlar &gt; Personel Yönetimi</em> ekranından adınızı ve şifrenizi kontrol etmesini rica edebilirsiniz.
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {forgotUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 text-xs truncate">{forgotUser?.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">@{forgotUser?.username} • {forgotUser?.role}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Güvenlik Sorusu
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
                    <ShieldQuestion size={16} className="text-indigo-600 shrink-0" />
                    <span>{forgotUser?.securityQuestion || "İlk evcil hayvanınızın adı nedir?"}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Güvenlik Sorusu Cevabı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={securityAnswerInput}
                    onChange={(e) => setSecurityAnswerInput(e.target.value)}
                    placeholder="Cevabınızı girin"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Yeni Şifre <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                    >
                      {showNewPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      {showNewPassword ? "Gizle" : "Göster"}
                    </button>
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="En az 4 karakter"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Yeni Şifre (Tekrar) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Yeni şifreyi tekrar girin"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setForgotStep(1); setForgotError(null); }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={16} /> Şifreyi Sıfırla
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
