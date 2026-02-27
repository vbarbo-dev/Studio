import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Eye, EyeSlash, Warning, CheckCircle, LockKey } from '@phosphor-icons/react';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid' | 'success'>('verifying');
  const [userId, setUserId] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('resetToken', '==', token));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setStatus('invalid');
          return;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.resetTokenExpires < Date.now()) {
          setStatus('invalid');
          return;
        }

        setUserId(userDoc.id);
        setStatus('valid');
      } catch (err) {
        console.error(err);
        setStatus('invalid');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          password: newPassword, // In a real app, hash this! But current app stores plain text based on Login.tsx logic
          resetToken: null,
          resetTokenExpires: null,
          needsPasswordChange: false
        });
        setStatus('success');
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      setError('Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Warning size={32} weight="duotone"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link Inválido ou Expirado</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">O link de recuperação de senha não é válido ou já expirou. Por favor, solicite um novo.</p>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} weight="duotone"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Senha Redefinida!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Sua senha foi alterada com sucesso. Você será redirecionado para o login.</p>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
            Ir para Login agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LockKey size={32} weight="duotone"/>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nova Senha</h2>
          <p className="text-gray-500 dark:text-slate-400">Crie uma nova senha segura para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl font-medium flex items-center gap-2">
              <Warning size={18}/> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Nova Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-4 pr-12 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                placeholder="Mínimo 6 caracteres"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-2"
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 ml-1">Confirmar Senha</label>
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-4 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
              placeholder="Repita a senha"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};
