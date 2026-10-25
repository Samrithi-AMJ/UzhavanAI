import type { Language } from './i18n';
import { transcribeAudioBackend } from './chatEngine';

// BCP-47 language codes for speech recognition in India
export const SPEECH_LANG_CODES: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
};

export const SPEECH_LANG_NAMES: Record<Language, { native: string; english: string }> = {
  en: { native: 'English', english: 'English (India)' },
  hi: { native: 'हिन्दी', english: 'Hindi' },
  ta: { native: 'தமிழ்', english: 'Tamil' },
  te: { native: 'తెలుగు', english: 'Telugu' },
  mr: { native: 'मराठी', english: 'Marathi' },
  bn: { native: 'বাংলা', english: 'Bengali' },
};

// Conversational farming prompts specifically tailored for voice searches
export const VOICE_SEARCH_PROMPTS: Record<Language, string[]> = {
  en: [
    'How do I treat stem borer in paddy?',
    'Best organic fertilizer for tomato plants',
    'How to control leaf curl disease in chilli?',
    'When is the right time to irrigate wheat?',
  ],
  hi: [
    'धान में तना छेदक कीट की रोकथाम कैसे करें?',
    'टमाटर के लिए सबसे अच्छी जैविक खाद कौन सी है?',
    'मिर्च में मरोड़िया (पत्ती मरोड़) रोग का इलाज क्या है?',
    'गेहूं की फसल में पहली सिंचाई कब करनी चाहिए?',
  ],
  ta: [
    'நெல் பயிரில் குருத்துப்பூச்சியை கட்டுப்படுத்துவது எப்படி?',
    'தக்காளி செடிக்கு சிறந்த இயற்கை உரம் எது?',
    'மிளகாய் இலை சுருட்டல் நோய்க்கு என்ன மருந்து?',
    'கரும்பு பயிருக்கு சொட்டு நீர் பாசனம் அமைப்பது எப்படி?',
  ],
  te: [
    'వరిలో కాండం తొలిచే పురుగు నివారణ ఎలా?',
    'టమోటా మొక్కలకు ఉత్తమ సేంద్రియ ఎరువు ఏది?',
    'మిరపలో ఆకు ముడత తెగులు నివారణ మందులు ఏమిటి?',
    'పత్తి పంటలో గులాబీ రంగు కాయ తొలుచు పురుగు నియంత్రణ?',
  ],
  mr: [
    'भातावरील खोडकिडीचा बंदोबस्त कसा करावा?',
    'टोमॅटोसाठी सर्वोत्तम सेंद्रिय खत कोणते?',
    'मिरचीवरील चुरडा-मुरडा (लीफ कर्ल) रोगावर उपाय काय?',
    'कपाशीवरील बोंडअळीचे नियंत्रण कसे करावे?',
  ],
  bn: [
    'ধানে মাজরা পোকা দমন করার উপায় কী?',
    'টমেটো গাছের জন্য সেরা জৈব সার কোনটি?',
    'লঙ্কা গাছের পাতা কোঁকড়ানো রোগের প্রতিকার কী?',
    'আলু ফসলে নাবি ধসা রোগ প্রতিরোধের উপায় কী?',
  ],
};

// Types for Web Speech Recognition API
interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    webkitAudioContext?: typeof AudioContext;
  }
}

/** Check if Web Speech Recognition is natively supported */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/** Check if Web Speech Synthesis (Text-to-Speech) is supported */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Check if MediaRecorder is supported for audio recording fallback */
export function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(navigator.mediaDevices && window.MediaRecorder);
}

// Global audio context for synthesized auditory tones and waveform analysis
let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return globalAudioCtx;
}

/**
 * Synthesizes a pleasant audio chime (no audio asset files required).
 * Used for start/stop acoustic feedback so farmers know the mic is active.
 */
export function playChime(type: 'start' | 'stop' | 'success' | 'alert'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      // Soft ascending chirp (480Hz -> 840Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'stop') {
      // Soft descending tone (760Hz -> 420Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(760, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.10, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'success') {
      // Gentle confirmation two-tone (587Hz -> 880Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === 'alert') {
      // Gentle warning buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (err) {
    console.debug('[UzhavanAI] Audio chime skipped:', err);
  }
}

/**
 * Connects an audio stream to an AnalyserNode to produce live frequency bars.
 */
export function setupAudioAnalyser(
  stream: MediaStream,
  onFrequencies: (bars: number[]) => void,
  barCount: number = 16
): () => void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return () => {};

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrameId: number;
    let active = true;

    const render = () => {
      if (!active) return;
      analyser.getByteFrequencyData(dataArray);

      // Downsample frequency data into `barCount` normalized bands (0 to 1)
      const step = Math.max(1, Math.floor(dataArray.length / barCount));
      const bars: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        bars.push(Math.min(1, Math.max(0.08, val / 255)));
      }
      onFrequencies(bars);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
      try {
        source.disconnect();
      } catch {
        // Ignore
      }
    };
  } catch (err) {
    console.warn('[UzhavanAI] Audio analyser setup failed:', err);
    return () => {};
  }
}

export type VoiceSessionCallbacks = {
  onStart?: () => void;
  onInterim?: (interimText: string, fullDraft: string) => void;
  onFinal?: (finalText: string) => void;
  onSilence?: (finalText: string) => void;
  onError?: (error: { code: string; message: string }) => void;
  onEnd?: () => void;
  onFrequencies?: (bars: number[]) => void;
};

export type VoiceSessionOptions = {
  language: Language;
  silenceTimeoutMs?: number; // silence duration before onSilence triggers (default: 1800ms)
  useBackendWhisperFallback?: boolean;
};

/**
 * Controller for an active voice search session.
 * Manages native speech recognition, live interim transcripts, silence detection,
 * audio visualization, and automatic fallback to backend Whisper.
 */
export class VoiceSearchSession {
  private recognition: SpeechRecognitionLike | null = null;
  private mediaStream: MediaStream | null = null;
  private stopAnalyser: (() => void) | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private options: VoiceSessionOptions;
  private callbacks: VoiceSessionCallbacks;

  private finalTranscript: string = '';
  private currentInterim: string = '';
  private isListening: boolean = false;
  private isStopping: boolean = false;
  private useWhisper: boolean = false;

  constructor(options: VoiceSessionOptions, callbacks: VoiceSessionCallbacks) {
    this.options = {
      silenceTimeoutMs: 1800,
      useBackendWhisperFallback: true,
      ...options,
    };
    this.callbacks = callbacks;
  }

  /** Starts the voice search session */
  public async start(): Promise<void> {
    if (this.isListening) return;

    this.finalTranscript = '';
    this.currentInterim = '';
    this.isStopping = false;

    // Check if we can use native browser SpeechRecognition
    const hasWebSpeech = isSpeechRecognitionSupported();

    try {
      // 1. Request microphone access for audio visualization and/or recording
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });

          // Connect audio visualizer if frequency callback provided
          if (this.callbacks.onFrequencies) {
            this.stopAnalyser = setupAudioAnalyser(this.mediaStream, this.callbacks.onFrequencies, 16);
          }
        } catch (permErr: unknown) {
          const name = (permErr as { name?: string })?.name;
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            this.callbacks.onError?.({
              code: 'NOT_ALLOWED',
              message: 'Microphone permission was denied. Please allow microphone access in your browser.',
            });
            return;
          }
        }
      }

      playChime('start');
      this.isListening = true;
      this.callbacks.onStart?.();

      if (hasWebSpeech) {
        this.useWhisper = false;
        this.initWebSpeech();
      } else {
        // Fallback to MediaRecorder + backend Groq Whisper
        this.useWhisper = true;
        this.initWhisperRecorder();
      }
    } catch (err: unknown) {
      console.error('[UzhavanAI] Voice search start failed:', err);
      const msg = err instanceof Error ? err.message : 'Could not start voice search';
      this.callbacks.onError?.({ code: 'START_FAILED', message: msg });
      this.stop();
    }
  }

  /** Switch language on the fly */
  public setLanguage(lang: Language): void {
    this.options.language = lang;
    if (this.recognition && !this.useWhisper) {
      const bcp47 = SPEECH_LANG_CODES[lang] || 'en-IN';
      this.recognition.lang = bcp47;
    }
  }

  private initWebSpeech(): void {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    this.recognition = new SpeechRec();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = SPEECH_LANG_CODES[this.options.language] || 'en-IN';

    this.recognition.onstart = () => {
      // Recognition actively listening
    };

    this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) {
          const phrase = res[0].transcript.trim();
          if (phrase) {
            this.finalTranscript = this.finalTranscript
              ? `${this.finalTranscript} ${phrase}`
              : phrase;
          }
        } else {
          interim += res[0].transcript;
        }
      }

      this.currentInterim = interim.trim();
      const combined = [this.finalTranscript, this.currentInterim].filter(Boolean).join(' ');

      this.callbacks.onInterim?.(this.currentInterim, combined);

      // Reset silence detection timer
      this.resetSilenceTimer(combined);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      console.warn('[UzhavanAI] WebSpeech error:', event.error);

      if (event.error === 'no-speech') {
        // Normal silence timeout from browser
        return;
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.callbacks.onError?.({
          code: 'NOT_ALLOWED',
          message: 'Microphone permission denied.',
        });
        this.stop();
        return;
      }

      // If network or speech engine fails, try fallback to whisper recorder if we have a stream
      if (this.options.useBackendWhisperFallback && this.mediaStream && !this.finalTranscript) {
        console.info('[UzhavanAI] Falling back to backend Whisper audio recording...');
        this.useWhisper = true;
        this.initWhisperRecorder();
        return;
      }

      this.callbacks.onError?.({
        code: event.error || 'SPEECH_ERROR',
        message: event.message || `Speech recognition error: ${event.error}`,
      });
    };

    this.recognition.onend = () => {
      if (this.isListening && !this.isStopping) {
        // Browser recognition sometimes stops after a pause; restart if still intended
        try {
          this.recognition?.start();
        } catch {
          this.finish();
        }
      } else {
        this.finish();
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('[UzhavanAI] Could not start WebSpeech instance:', err);
      if (this.options.useBackendWhisperFallback && this.mediaStream) {
        this.useWhisper = true;
        this.initWhisperRecorder();
      }
    }
  }

  private initWhisperRecorder(): void {
    if (!this.mediaStream || !isMediaRecorderSupported()) {
      this.callbacks.onError?.({
        code: 'NOT_SUPPORTED',
        message: 'Voice recording is not supported in this browser.',
      });
      this.stop();
      return;
    }

    try {
      this.recordedChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(250);
    } catch (err) {
      console.error('[UzhavanAI] MediaRecorder init failed:', err);
      this.callbacks.onError?.({
        code: 'RECORDER_ERROR',
        message: 'Could not start audio recorder.',
      });
      this.stop();
    }
  }

  private resetSilenceTimer(currentText: string): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    const timeout = this.options.silenceTimeoutMs || 1800;
    this.silenceTimer = setTimeout(() => {
      const finalCandidate = currentText || this.finalTranscript;
      if (finalCandidate && finalCandidate.trim().length > 1) {
        this.callbacks.onSilence?.(finalCandidate.trim());
      }
    }, timeout);
  }

  /** Stop listening and finalize transcript */
  public async stop(): Promise<string> {
    if (!this.isListening) return this.finalTranscript;
    this.isStopping = true;
    playChime('stop');

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.stopAnalyser) {
      this.stopAnalyser();
      this.stopAnalyser = null;
    }

    // Stop native recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    // If using Whisper fallback, finalize the recording and transcribe
    if (this.useWhisper && this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        const transResult = await new Promise<string>((resolve) => {
          this.mediaRecorder!.onstop = async () => {
            const blob = new Blob(this.recordedChunks, {
              type: this.mediaRecorder?.mimeType || 'audio/webm',
            });
            if (blob.size < 1000) {
              resolve('');
              return;
            }
            try {
              const reader = new FileReader();
              reader.onloadend = async () => {
                try {
                  const b64 = reader.result as string;
                  const text = await transcribeAudioBackend(
                    b64,
                    this.mediaRecorder?.mimeType || 'audio/webm',
                    this.options.language
                  );
                  resolve(text);
                } catch (err) {
                  console.error('[UzhavanAI] Backend transcription error:', err);
                  resolve('');
                }
              };
              reader.readAsDataURL(blob);
            } catch {
              resolve('');
            }
          };
          this.mediaRecorder!.stop();
        });

        if (transResult) {
          this.finalTranscript = transResult;
        }
      } catch (err) {
        console.error('[UzhavanAI] Whisper recording finalization failed:', err);
      }
    }

    // Release microphone tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.finish();
    return this.finalTranscript.trim();
  }

  /** Abort without submitting */
  public cancel(): void {
    this.isStopping = true;
    this.isListening = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.stopAnalyser) {
      this.stopAnalyser();
      this.stopAnalyser = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.callbacks.onEnd?.();
  }

  private finish(): void {
    if (!this.isListening) return;
    this.isListening = false;
    const finalResult = [this.finalTranscript, this.currentInterim].filter(Boolean).join(' ').trim();
    if (finalResult) {
      this.callbacks.onFinal?.(finalResult);
    }
    this.callbacks.onEnd?.();
  }
}

/**
 * Text-to-Speech (TTS) helper to read AI advisory answers out loud in the farmer's language.
 */
let currentSpeechUtterance: SpeechSynthesisUtterance | null = null;

export function getCurrentSpeechUtterance(): SpeechSynthesisUtterance | null {
  return currentSpeechUtterance;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      currentSpeechUtterance = null;
    } catch {
      // Ignore
    }
  }
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Strips markdown symbols (links, bold, headings, bullets, code blocks)
 * so speech synthesis pronounces agronomic advice naturally.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold/italics
    .replace(/[*_~`]/g, '')
    // Remove headers
    .replace(/^#+\s+/gm, '')
    // Remove blockquote markers
    .replace(/^>\s+/gm, '')
    // Replace bullet points with brief pauses
    .replace(/^[-*+]\s+/gm, ', ')
    // Replace numbered lists (1. 2.) with spoken numbers
    .replace(/^(\d+)\.\s+/gm, '$1, ')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Collapse excess whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reads aloud text in the requested language using the browser's speech synthesis engine.
 */
export function speakText(
  text: string,
  language: Language,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.(new Error('Speech synthesis not supported'));
    return false;
  }

  stopSpeaking();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return false;

  try {
    const utterance = new SpeechSynthesisUtterance(cleaned);
    const targetLocale = SPEECH_LANG_CODES[language] || 'en-IN';
    utterance.lang = targetLocale;
    utterance.rate = 0.95; // Slightly slower, clear conversational pace
    utterance.pitch = 1.0;

    // Try finding a matching localized voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const langPrefix = targetLocale.split('-')[0].toLowerCase();
      const match = voices.find(
        (v) => v.lang.toLowerCase() === targetLocale.toLowerCase() || v.lang.toLowerCase().startsWith(langPrefix)
      );
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      currentSpeechUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      currentSpeechUtterance = null;
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        options?.onError?.(e);
      } else {
        options?.onEnd?.();
      }
    };

    currentSpeechUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('[UzhavanAI] speakText failed:', err);
    options?.onError?.(err);
    return false;
  }
}
