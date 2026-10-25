import { type ReactNode, useState } from 'react';
import { useAuth } from '../lib/auth';
import { LANGUAGES, t, type Language } from '../lib/i18n';
import InstallAppBanner from './InstallAppBanner';
import {
  Sprout, LayoutDashboard, MessageSquare, CloudSun, Wheat,
  LogOut, User as UserIcon, ScanLine, Globe, Check, Map as MapIcon,
} from 'lucide-react';

export type Page = 'dashboard' | 'chatbot' | 'weather' | 'crops' | 'image' | 'farm';

type Props = {
  current: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
};

export default function Layout({ current, onNavigate, children }: Props) {
  const { profile, signOut, language, setLanguage } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const tr = t(language);

  const NAV_ITEMS: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: tr.dashboard, icon: LayoutDashboard },
    { id: 'farm', label: tr.myFarm, icon: MapIcon },
    { id: 'chatbot', label: tr.aiAdvisor, icon: MessageSquare },
    { id: 'weather', label: tr.weather, icon: CloudSun },
    { id: 'crops', label: tr.cropAdvisor, icon: Wheat },
    { id: 'image', label: tr.imageSearch, icon: ScanLine },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-gray-900">UzhavanAI</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Install App button in sidebar */}
        <InstallAppBanner language={language} variant="sidebar" />

        {/* Language selector */}
        <div className="px-3 pb-2">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
            >
              <Globe className="h-5 w-5 text-gray-400" />
              {tr.language}: {LANGUAGES.find((l) => l.code === language)?.nativeLabel}
            </button>
            {langOpen && (
              <div className="absolute bottom-full mb-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code as Language); setLangOpen(false); }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 ${
                      language === l.code ? 'font-semibold text-primary-700' : 'text-gray-700'
                    }`}
                  >
                    {l.nativeLabel} <span className="text-xs text-gray-400">{l.label}</span>
                    {language === l.code && <Check className="h-4 w-4 text-primary-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {profile?.full_name || tr.farmer}
              </p>
              <p className="truncate text-xs text-gray-500">
                {profile?.farm_name || profile?.location || tr.myFarm}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-error-50 hover:text-error-700"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            {tr.signOut}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900">UzhavanAI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 text-sm text-gray-500"
          >
            <Globe className="h-4 w-4" />
            {LANGUAGES.find((l) => l.code === language)?.nativeLabel}
          </button>
          <button onClick={signOut} className="text-gray-500 hover:text-error-600">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile language dropdown */}
      {langOpen && (
        <div className="fixed inset-x-0 top-14 z-30 mx-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg lg:hidden">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l.code as Language); setLangOpen(false); }}
              className={`flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 ${
                language === l.code ? 'font-semibold text-primary-700' : 'text-gray-700'
              }`}
            >
              {l.nativeLabel} <span className="text-xs text-gray-400">{l.label}</span>
              {language === l.code && <Check className="h-4 w-4 text-primary-600" />}
            </button>
          ))}
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-gray-200 bg-white lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-1 min-w-[60px] flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                active ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <div className="min-h-screen px-4 pb-20 pt-16 lg:px-8 lg:pb-8 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Floating mobile install prompt */}
      <InstallAppBanner language={language} variant="floating" />
    </div>
  );
}
