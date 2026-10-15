import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Sprout, Mail, Lock, User as UserIcon, Loader2, AlertCircle, CloudSun, TrendingUp, MessageSquare } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left: Hero */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-8 text-white lg:p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-secondary-400 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-accent-400 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Sprout className="h-6 w-6" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">UzhavanAI</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-extrabold leading-tight lg:text-5xl">
            Smart Farming Starts Here
          </h1>
          <p className="mt-4 text-lg text-primary-100">
            AI-powered advisory, real-time weather, and data-driven crop recommendations —
            everything you need to grow more with less.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: MessageSquare, title: 'AI Advisory Chatbot', desc: 'Get instant answers to farming questions' },
              { icon: CloudSun, title: 'Live Weather Forecast', desc: '7-day forecast tailored to your location' },
              { icon: TrendingUp, title: 'Crop Recommendations', desc: 'Data-driven suggestions based on your soil' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-primary-200">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-sm text-primary-300">
          Trusted by farmers across 100+ regions
        </p>
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-gray-900">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-gray-500">
              {mode === 'signin'
                ? 'Sign in to access your farming dashboard'
                : 'Start your smart farming journey today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Farmer"
                    className="input-field pl-11"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@farm.com"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 ring-1 ring-error-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Please wait...
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-3 text-gray-500 font-medium">Or continue without account</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signInAsGuest('Tamil Farmer')}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-400"
          >
            <Sprout className="h-4 w-4 text-primary-600" />
            Explore as Demo Farmer (Instant Access)
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="font-semibold text-primary-600 hover:text-primary-700"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
