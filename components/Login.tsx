
import React, { useState } from 'react';
import { Role, User } from '../types';
import { ShieldCheck, Lock, User as UserIcon, Hotel, Eye, EyeOff, AlertCircle, UserPlus, ArrowRight, HelpCircle, KeyRound, ArrowLeft } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: Omit<User, 'id' | 'role'>) => void;
  onResetPassword: (userId: string, newPass: string) => void;
}

const SECURITY_QUESTIONS = [
  "İlk evcil hayvanınızın adı nedir?",
  "Doğduğunuz şehir neresidir?",
  "Annenizin kızlık soyadı nedir?",
  "İlkokul öğretmeninizin adı nedir?",
  "En sevdiğiniz yemek nedir?"
];

export const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister, onResetPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) onLogin(user); else { setError("Hatalı kullanıcı adı veya şifre!"); setPassword(""); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="bg-indigo-600 p-4 rounded-2xl inline-block mb-4 shadow-lg shadow-indigo-500/20">
          <Hotel size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">OtelPro Enterprise</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Personel Girişi</h2>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-bold">{error}</div>}

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
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Kullanıcı adınız"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                autoComplete="current-password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
            Giriş Yap <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};