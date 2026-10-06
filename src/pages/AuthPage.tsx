import { useState } from 'react';
import { Loader2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { navigate } from '@/lib/router';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignup) {
      const { error: signUpError } = await signUp(email, password, username);
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }
      navigate({ name: 'profile' });
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
        setLoading(false);
        return;
      }
      navigate({ name: 'home' });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-zinc-900/60 p-8 ring-1 ring-zinc-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isSignup ? 'Создать аккаунт' : 'Вход'}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {isSignup ? 'Регистрация для доступа к закладкам и комментариям' : 'Рады видеть вас снова'}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Имя пользователя</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    minLength={2}
                    placeholder="YourName"
                    className="w-full rounded-lg bg-zinc-800/60 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-zinc-700/50 focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg bg-zinc-800/60 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-zinc-700/50 focus:ring-2 focus:ring-rose-500/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Пароль</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Минимум 6 символов"
                  className="w-full rounded-lg bg-zinc-800/60 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-zinc-700/50 focus:ring-2 focus:ring-rose-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignup ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-zinc-500">
            {isSignup ? (
              <>Уже есть аккаунт? <button onClick={() => navigate({ name: 'login' })} className="text-rose-400 hover:text-rose-300">Войти</button></>
            ) : (
              <>Нет аккаунта? <button onClick={() => navigate({ name: 'signup' })} className="text-rose-400 hover:text-rose-300">Регистрация</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
