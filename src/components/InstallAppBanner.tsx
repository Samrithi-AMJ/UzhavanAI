import { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, Check } from 'lucide-react';
import type { Language } from '../lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Props = {
  language?: Language;
  variant?: 'floating' | 'sidebar' | 'inline';
};

export default function InstallAppBanner({ language = 'en', variant = 'floating' }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  const localizedButtonLabel = {
    en: 'Install Mobile App',
    hi: 'मोबाइल ऐप इंस्टॉल करें',
    ta: 'மொபைல் ஆப் நிறுவு',
    te: 'మొబైల్ యాప్ ఇన్‌స్టాల్ చేయండి',
    mr: 'मोबाइल ॲप इन्स्टॉल करा',
    bn: 'মোবাইল অ্যাপ ইনস্টল করুন',
  }[language] || 'Install Mobile App';

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isRunningStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setDismissed(true), 3500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback instructions for browsers where prompt cannot be triggered programmatically
      alert(
        'To install UzhavanAI on your phone:\n1. Open your browser menu (three dots in Chrome).\n2. Tap "Install App" or "Add to Home screen".'
      );
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[UzhavanAI] Install prompt error:', err);
    }
  };

  // If already installed as an app or dismissed, hide
  if (isStandalone || dismissed) return null;

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex w-full items-center justify-between rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-emerald-50 px-3 py-2.5 text-xs font-semibold text-primary-800 shadow-sm transition-all hover:border-primary-400 hover:shadow"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary-600" />
            <span>{localizedButtonLabel}</span>
          </div>
          <Download className="h-3.5 w-3.5 text-primary-600" />
        </button>

        {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
      </div>
    );
  }

  // Floating mobile toast banner
  return (
    <>
      <div className="fixed bottom-16 left-3 right-3 z-40 lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary-300 bg-white/95 p-3.5 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                {installedSuccess ? 'App Installed!' : 'Install UzhavanAI App'}
              </p>
              <p className="text-[11px] text-gray-500">
                {installedSuccess
                  ? 'Access it anytime from your home screen'
                  : 'Fast mobile access & works offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!installedSuccess ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-primary-700 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Check className="h-4 w-4" /> Ready
              </span>
            )}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showIosModal && <IosInstallModal onClose={() => setShowIosModal(false)} />}
    </>
  );
}

function IosInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary-600" />
            <h3 className="text-sm font-bold text-gray-900">Install on iPhone / iPad</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-xs text-gray-600">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Share className="h-4 w-4" />
            </div>
            <p>
              1. Tap the <span className="font-semibold text-gray-900">Share</span> button at the bottom of Safari.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <PlusSquare className="h-4 w-4" />
            </div>
            <p>
              2. Scroll down and tap <span className="font-semibold text-gray-900">"Add to Home Screen"</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Check className="h-4 w-4" />
            </div>
            <p>
              3. Tap <span className="font-semibold text-gray-900">"Add"</span> in the top-right corner.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn-primary mt-5 w-full py-2.5 text-xs font-bold"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
