import React, { useState } from 'react';
import { ArrowRight, Eye, EyeSlash, Sun, Moon, SquaresFour, CalendarCheck, Warning, X, CheckCircle } from '@phosphor-icons/react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onPasswordChange: (email: string, newPass: string) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onPasswordChange, isDarkMode, toggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'login' | 'change_password'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [forgotMessage, setForgotMessage] = useState('');

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
        const result = await onLogin(email, password);
        if (result === (true as any)) return;
        if (result === ('needs_change' as any)) {
            setView('change_password');
        } else {
            // Firebase auth errors are usually thrown, so this might not be reached if onLogin throws
            setError('Credenciais inválidas.');
        }
    } catch (err: any) {
        console.error("Login error:", err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError('E-mail ou senha incorretos.');
        } else if (err.code === 'auth/too-many-requests') {
            setError('Muitas tentativas. Tente novamente mais tarde.');
        } else {
            setError('Erro ao entrar. Verifique suas credenciais.');
        }
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
    }
    onPasswordChange(email, newPassword);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotStatus('loading');
      setForgotMessage('');

      try {
          await sendPasswordResetEmail(auth, forgotEmail);
          setForgotStatus('success');
          setForgotMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      } catch (err: any) {
          console.error(err);
          setForgotStatus('error');
          if (err.code === 'auth/user-not-found') {
              setForgotMessage('E-mail não encontrado.');
          } else {
              setForgotMessage('Erro ao processar solicitação. Tente novamente.');
          }
      }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F7] dark:bg-slate-900 transition-colors duration-300">
      
      {/* Forgot Password Modal */}
      {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-fade-in-up">
                  <button onClick={() => setShowForgotModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"><X size={20} /></button>
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <SquaresFour size={32} weight="duotone"/>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recuperar Senha</h3>
                      <p className="text-gray-500 dark:text-slate-400">Digite seu e-mail para receber um link de redefinição.</p>
                  </div>

                  {forgotStatus === 'success' ? (
                      <div className="text-center">
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl mb-6 flex items-center justify-center gap-2">
                              <CheckCircle size={24} weight="fill"/>
                              <span className="font-medium">E-mail enviado com sucesso!</span>
                          </div>
                          <button onClick={() => setShowForgotModal(false)} className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                              Voltar ao Login
                          </button>
                      </div>
                  ) : (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                          {forgotStatus === 'error' && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium flex items-center gap-2">
                                  <Warning size={18}/> {forgotMessage}
                              </div>
                          )}
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Seu E-mail</label>
                              <input 
                                  type="email" 
                                  required 
                                  value={forgotEmail}
                                  onChange={e => setForgotEmail(e.target.value)}
                                  className="w-full p-4 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                  placeholder="exemplo@zyndo.com.br"
                              />
                          </div>
                          <button 
                              type="submit" 
                              disabled={forgotStatus === 'loading'}
                              className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              {forgotStatus === 'loading' ? 'Enviando...' : 'Enviar Link'}
                          </button>
                      </form>
                  )}
              </div>
          </div>
      )}

      {/* LEFT SIDE: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        
        {/* Logo Header */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
            <img 
                src="/favicon/android-chrome-192x192.png" 
                alt="Zyndo Logo" 
                className="w-10 h-10 rounded-xl shadow-md"
            />
            <span className="text-2xl font-bold text-blue-800 dark:text-blue-500 font-['Bruno_Ace_SC'] tracking-wider">
                ZYNDO
            </span>
        </div>

        {/* Theme Toggle */}
        {toggleTheme && (
            <button 
                onClick={toggleTheme}
                className="absolute top-8 right-8 p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
                {isDarkMode ? <Sun size={24} weight="fill" /> : <Moon size={24} weight="fill" />}
            </button>
        )}

        <div className="w-full max-w-sm animate-fade-in">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {view === 'login' ? 'Bem-vindo de volta' : 'Definir nova senha'}
                </h1>
                <p className="text-gray-500 dark:text-slate-400">
                    {view === 'login' 
                        ? 'Digite suas credenciais para acessar o painel.' 
                        : 'Por segurança, atualize sua senha para continuar.'}
                </p>
            </div>

            {view === 'login' ? (
                <form onSubmit={handleAttempt} className="space-y-6">
                    {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium flex items-center gap-2"><Warning size={18}/> {error}</div>}
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Email</label>
                        <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full p-4 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="exemplo@zyndo.com.br"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Senha</label>
                            <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Esqueceu?</button>
                        </div>
                        <div className="relative">
                            <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-4 pr-12 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                            placeholder="••••••••"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-2 rounded-lg transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]">
                        Entrar na conta
                    </button>
                </form>
            ) : (
                <form onSubmit={handleChangePassword} className="space-y-6">
                    {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium flex items-center gap-2"><Warning size={18}/> {error}</div>}
                    
                    <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Nova Senha</label>
                    <div className="relative">
                        <input 
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full p-4 pr-12 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            placeholder="Mínimo 6 caracteres"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-2"
                        >
                            {showNewPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    </div>
                    <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Confirmar Senha</label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full p-4 pr-12 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            placeholder="Repita a senha"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-2"
                        >
                            {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    </div>
                    
                    <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2">
                        Atualizar e Entrar <ArrowRight size={20} weight="bold"/>
                    </button>
                </form>
            )}
        </div>
        
        <div className="mt-12 text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500">© 2026 Zyndo Tecnologia.</p>
        </div>
      </div>

      {/* RIGHT SIDE: Visuals (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900 relative items-center justify-center p-12 overflow-hidden">
          
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10 w-full max-w-lg">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    Gestão inteligente <br/>
                    para o seu <span className="text-blue-300">condomínio</span>.
                </h2>
                <p className="text-blue-100 text-lg mb-12 leading-relaxed">
                    Acompanhe reservas, ocorrências e comunicados em tempo real. Tudo em um só lugar, simples e transparente.
                </p>

                {/* Floating Mockup Elements */}
                <div className="relative h-64 w-full perspective-1000">
                    {/* Card 1: Dashboard Stats */}
                    <div className="absolute top-0 left-0 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl transform rotate-[-6deg] hover:rotate-0 transition-transform duration-500 z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg"><SquaresFour size={20} className="text-white" weight="fill"/></div>
                            <div className="h-2 w-20 bg-white/30 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-16 w-full bg-white/10 rounded-xl"></div>
                            <div className="flex gap-2">
                                <div className="h-8 w-1/2 bg-white/10 rounded-lg"></div>
                                <div className="h-8 w-1/2 bg-white/10 rounded-lg"></div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Notification/Event */}
                    <div className="absolute top-8 right-0 w-72 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-2xl transform rotate-[6deg] hover:rotate-0 transition-transform duration-500 z-20">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-green-400 rounded-lg shadow-lg shadow-green-400/30"><CalendarCheck size={16} className="text-white" weight="bold"/></div>
                                <div className="h-2 w-24 bg-white/50 rounded-full"></div>
                            </div>
                            <div className="h-2 w-8 bg-white/30 rounded-full"></div>
                        </div>
                        <div className="h-3 w-full bg-white/40 rounded-full mb-2"></div>
                        <div className="h-3 w-3/4 bg-white/40 rounded-full mb-4"></div>
                        <div className="flex justify-between items-center">
                            <div className="flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-300 border border-white/20"></div>
                                <div className="w-6 h-6 rounded-full bg-purple-300 border border-white/20"></div>
                            </div>
                            <div className="h-6 w-16 bg-white/20 rounded-lg"></div>
                        </div>
                    </div>
                </div>
          </div>
      </div>
    </div>
  );
};
