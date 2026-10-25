import { useEffect, useState, useRef } from 'react';
import {
  Mic,
  Send,
  X,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Globe,
  Edit3,
  Clock,
  Radio,
} from 'lucide-react';
import { LANGUAGES, t, type Language } from '../lib/i18n';
import {
  VoiceSearchSession,
  VOICE_SEARCH_PROMPTS,
  SPEECH_LANG_NAMES,
  SPEECH_LANG_CODES,
  isSpeechRecognitionSupported,
} from '../lib/voiceSearch';

type Props = {
  active: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onTranscriptComplete: (text: string, autoSubmit?: boolean) => void;
  onClose: () => void;
};

export default function VoiceSearchPanel({
  active,
  language,
  onLanguageChange,
  onTranscriptComplete,
  onClose,
}: Props) {
  const tr = t(language);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(16).fill(0.1));
  const [autoSend, setAutoSend] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWhisperFallback, setIsWhisperFallback] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const sessionRef = useRef<VoiceSearchSession | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prompts = VOICE_SEARCH_PROMPTS[language] || VOICE_SEARCH_PROMPTS.en;

  const autoSendRef = useRef(autoSend);
  autoSendRef.current = autoSend;

  const trRef = useRef(tr);
  trRef.current = tr;

  // Clear countdown interval safely
  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const handleSend = async (overrideText?: string) => {
    clearCountdown();
    let textToSend = overrideText || transcript;
    if (sessionRef.current) {
      const stoppedText = await sessionRef.current.stop();
      if (stoppedText) textToSend = stoppedText;
    }
    const finalClean = (textToSend || transcript).trim();
    if (finalClean) {
      onTranscriptComplete(finalClean, true);
    }
    onClose();
  };

  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  // Start countdown before auto-sending
  const triggerAutoSendCountdown = (textToSend: string) => {
    if (!autoSendRef.current || !textToSend.trim()) return;

    clearCountdown();
    let secondsLeft = 2;
    setCountdown(secondsLeft);

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearCountdown();
        handleSendRef.current(textToSend);
      } else {
        setCountdown(secondsLeft);
      }
    }, 1000);
  };

  const triggerAutoSendRef = useRef(triggerAutoSendCountdown);
  triggerAutoSendRef.current = triggerAutoSendCountdown;

  // Start voice recognition session when active becomes true
  useEffect(() => {
    if (!active) {
      clearCountdown();
      sessionRef.current?.cancel();
      sessionRef.current = null;
      setTranscript('');
      setInterimText('');
      setErrorMessage(null);
      setFrequencyBars(new Array(16).fill(0.1));
      return;
    }

    const hasNative = isSpeechRecognitionSupported();
    setIsWhisperFallback(!hasNative);
    setErrorMessage(null);
    clearCountdown();

    const session = new VoiceSearchSession(
      {
        language,
        silenceTimeoutMs: 1800,
        useBackendWhisperFallback: true,
      },
      {
        onStart: () => {
          setErrorMessage(null);
        },
        onInterim: (interim, fullDraft) => {
          setInterimText(interim);
          setTranscript(fullDraft);
          clearCountdown();
        },
        onFinal: (finalText) => {
          setTranscript(finalText);
          setInterimText('');
        },
        onSilence: (finalCandidate) => {
          if (finalCandidate && finalCandidate.trim().length > 1) {
            triggerAutoSendRef.current(finalCandidate.trim());
          }
        },
        onError: (err) => {
          console.warn('[UzhavanAI VoicePanel] Error:', err);
          if (err.code === 'NOT_ALLOWED') {
            setErrorMessage(trRef.current.voicePermissionDenied);
          } else if (err.code === 'no-speech') {
            setErrorMessage(trRef.current.noSpeechDetected);
          } else {
            setErrorMessage(err.message || 'Voice search failed. Please try again.');
          }
        },
        onFrequencies: (bars) => {
          setFrequencyBars(bars);
        },
        onEnd: () => {
          // Keep transcript in view
        },
      }
    );

    sessionRef.current = session;
    session.start();

    return () => {
      clearCountdown();
      session.cancel();
      sessionRef.current = null;
    };
  }, [active, language]);

  const handleStopAndEdit = async () => {
    clearCountdown();
    let finalText = transcript;
    if (sessionRef.current) {
      finalText = await sessionRef.current.stop();
    }
    const result = finalText || transcript;
    if (result.trim()) {
      onTranscriptComplete(result.trim(), false);
    }
    onClose();
  };

  const handleRetry = () => {
    clearCountdown();
    setTranscript('');
    setInterimText('');
    setErrorMessage(null);
    if (sessionRef.current) {
      sessionRef.current.cancel();
      sessionRef.current.start();
    }
  };

  const handleSelectPrompt = (promptText: string) => {
    clearCountdown();
    setTranscript(promptText);
    setInterimText('');
    handleSend(promptText);
  };

  const handleLanguageChange = (lang: Language) => {
    setShowLanguageDropdown(false);
    onLanguageChange(lang);
    if (sessionRef.current) {
      sessionRef.current.setLanguage(lang);
    }
  };

  if (!active) return null;

  const currentLangMeta = SPEECH_LANG_NAMES[language] || SPEECH_LANG_NAMES.en;
  const activeLocaleTag = SPEECH_LANG_CODES[language] || 'en-IN';

  return (
    <div
      role="region"
      aria-label={tr.voiceSearch}
      className="mb-3 overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/80 via-white to-white p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 sm:p-5"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-primary-100/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{tr.voiceSearch}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-600" />
                {tr.listening}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {isWhisperFallback ? 'Whisper AI Audio Recognition' : `Web Speech (${activeLocaleTag})`}
            </p>
          </div>
        </div>

        {/* Controls: Language Chip & Close */}
        <div className="flex items-center gap-2">
          {/* Quick Language Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-50"
              title={tr.spokenLanguage}
            >
              <Globe className="h-3.5 w-3.5 text-primary-600" />
              <span>{currentLangMeta.native}</span>
              <span className="text-[10px] text-gray-400">({language.toUpperCase()})</span>
            </button>

            {showLanguageDropdown && (
              <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                <div className="border-b border-gray-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {tr.spokenLanguage}
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-primary-50 ${
                      language === l.code ? 'font-semibold text-primary-700 bg-primary-50/50' : 'text-gray-700'
                    }`}
                  >
                    <span>{l.nativeLabel}</span>
                    <span className="text-[10px] text-gray-400">{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Real-time Frequency Waveform Bars */}
      <div className="my-3 flex h-12 items-center justify-center gap-1 rounded-xl bg-gray-900/90 px-4 py-2 shadow-inner">
        {frequencyBars.map((bar, idx) => {
          const heightPercent = Math.max(14, Math.round(bar * 100));
          const isMid = idx >= 4 && idx <= 11;
          return (
            <div
              key={idx}
              className="flex h-full w-2 items-end justify-center rounded-full bg-gray-800/60"
            >
              <div
                className={`w-full rounded-full transition-all duration-75 ${
                  isMid
                    ? 'bg-gradient-to-t from-emerald-500 via-primary-400 to-lime-300'
                    : 'bg-gradient-to-t from-emerald-600 to-primary-500'
                }`}
                style={{
                  height: `${heightPercent}%`,
                  boxShadow: bar > 0.3 ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Transcript Text Display */}
      <div className="min-h-[4rem] rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm">
        {transcript || interimText ? (
          <p className="text-sm leading-relaxed text-gray-900">
            <span className="font-medium">{transcript}</span>
            {interimText && <span className="ml-1 text-primary-600 opacity-75">{interimText}</span>}
          </p>
        ) : errorMessage ? (
          <div className="flex items-center gap-2 text-xs text-error-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Mic className="h-4 w-4 text-primary-500" />
            <span>{tr.speakNow}</span>
          </div>
        )}
      </div>

      {/* Auto-send Countdown Banner (if silence detected) */}
      {countdown !== null && (
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-1.5 text-xs text-amber-800 border border-amber-200">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 animate-spin text-amber-600" />
            <span>
              {tr.autoSendIn} {countdown}s...
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearCountdown}
              className="text-[11px] font-semibold text-amber-900 underline hover:text-amber-700"
            >
              {tr.keepEditing}
            </button>
            <button
              type="button"
              onClick={() => handleSend()}
              className="rounded-md bg-amber-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-amber-700"
            >
              {tr.sendNow}
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons & Auto-Send Toggle */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Left: Auto-send checkbox */}
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
          <input
            type="checkbox"
            checked={autoSend}
            onChange={(e) => {
              setAutoSend(e.target.checked);
              if (!e.target.checked) clearCountdown();
            }}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span>{tr.autoSendToggle}</span>
        </label>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {transcript && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
              title="Clear & Try Again"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{tr.clear}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStopAndEdit}
            disabled={!transcript.trim()}
            className="flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-40"
            title="Transfer to input to edit"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{tr.keepEditing}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!transcript.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-bold text-white shadow transition-all hover:bg-primary-700 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{tr.sendNow}</span>
          </button>
        </div>
      </div>

      {/* Quick Agricultural Voice Query Prompts */}
      <div className="mt-3 border-t border-primary-100/60 pt-2.5">
        <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-gray-500">
          <Sparkles className="h-3 w-3 text-primary-500" />
          <span>{tr.trySaying}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(p)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-left text-[11px] text-gray-600 transition-all hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
