import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase, type ChatMessage, type CropResult } from '../lib/supabase';
import {
  askAdvisor,
  checkAdvisorHealth,
  friendlyAdvisorMessage,
  AdvisorError,
  type AdvisorHealth,
  type ChatTurn,
  type FarmerContext,
  type WeatherContext,
  type KnowledgeSource,
  type GroundingType,
} from '../lib/chatEngine';
import { loadFarmBoundary } from '../lib/farm';
import { fetchWeather } from '../lib/weather';
import { MessageSquare, Send, Loader2, Trash2, Bot, User as UserIcon, Sparkles, AlertCircle } from 'lucide-react';

const SUGGESTIONS = [
  'How do I manage pests in rice?',
  'Best fertilizer for wheat?',
  'When to irrigate maize?',
  'Which crops suit dry soil?',
];

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 20;

type UIMessage = ChatMessage & { isError?: boolean; sources?: KnowledgeSource[]; grounding?: GroundingType };

// Note: `grounding` ('rag' | 'general' | 'refused') is kept on each message
// for potential future debugging/analytics use, but is intentionally NEVER
// rendered in the chat UI — farmers should see a clean answer with no
// internal RAG/fallback status text under it (e.g. no "general guidance,
// no specific source" label). Only the "Sources:" list below is shown, and
// only when real sources were actually retrieved and used.

export default function ChatbotPage() {
  const { user, profile, language } = useAuth();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [health, setHealth] = useState<AdvisorHealth | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const farmerContextRef = useRef<FarmerContext | null>(null);
  const weatherContextRef = useRef<WeatherContext>('unavailable');

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setMessages((data as ChatMessage[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    checkAdvisorHealth().then(setHealth);
  }, []);

  // Build farmer + weather context once per session (profile/user rarely
  // changes mid-chat). Best-effort: any failure here just leaves that piece
  // of context out rather than blocking the chat.
  useEffect(() => {
    async function buildContext() {
      if (!user) return;

      let latitude = profile?.latitude ?? null;
      let longitude = profile?.longitude ?? null;
      let farmSizeAcres = profile?.farm_size_acres ?? null;

      try {
        const boundary = await loadFarmBoundary(user.id);
        if (boundary) {
          if (boundary.center_latitude != null) latitude = boundary.center_latitude;
          if (boundary.center_longitude != null) longitude = boundary.center_longitude;
          if (boundary.area_acres != null) farmSizeAcres = boundary.area_acres;
        }
      } catch (err) {
        console.error('[UzhavanAI] Could not load farm boundary for chat context:', err);
      }

      let topCrop: string | null = null;
      try {
        const { data } = await supabase
          .from('crop_recommendations')
          .select('results')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const results = data?.results as unknown as CropResult[] | undefined;
        if (results && results.length > 0) topCrop = results[0].name;
      } catch (err) {
        console.error('[UzhavanAI] Could not load crop recommendations for chat context:', err);
      }

      farmerContextRef.current = {
        name: profile?.full_name || null,
        farmName: profile?.farm_name || null,
        location: profile?.location || null,
        latitude,
        longitude,
        farmSizeAcres,
        topCrop,
      };

      if (latitude != null && longitude != null) {
        try {
          const weather = await fetchWeather(latitude, longitude);
          weatherContextRef.current = {
            temperature: weather.current.temperature,
            humidity: weather.current.humidity,
            precipitationProbability: weather.forecast[0]?.precipitationProbability,
            description: weather.current.weatherDescription,
          };
        } catch (err) {
          console.error('[UzhavanAI] Could not fetch weather for chat context:', err);
          weatherContextRef.current = 'unavailable';
        }
      } else {
        weatherContextRef.current = 'unavailable';
      }
    }
    buildContext();
  }, [user, profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!user || sending) return;

    if (!trimmed) {
      setInputError(friendlyAdvisorMessage(new AdvisorError('EMPTY_MESSAGE', ''), language));
      return;
    }
    if (trimmed.length >= MAX_MESSAGE_LENGTH) {
      setInputError(friendlyAdvisorMessage(new AdvisorError('MESSAGE_TOO_LONG', ''), language));
      return;
    }

    setInputError(null);
    setSending(true);
    setInput('');

    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    const historyForModel: ChatTurn[] = [
      ...messages.filter((m) => !m.isError).slice(-HISTORY_LIMIT).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: trimmed },
    ].slice(-HISTORY_LIMIT);

    setMessages((prev) => [...prev, userMsg]);
    await supabase.from('chat_history').insert({ role: 'user', content: trimmed });

    try {
      const { reply, sources, grounding } = await askAdvisor({
        history: historyForModel,
        language,
        farmer: farmerContextRef.current,
        weather: weatherContextRef.current,
      });

      const aiMsg: UIMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
        sources,
        grounding,
      };
      setMessages((prev) => [...prev, aiMsg]);
      await supabase.from('chat_history').insert({ role: 'assistant', content: reply });
    } catch (err) {
      const advisorError = err instanceof AdvisorError ? err : new AdvisorError('UNKNOWN', 'Unknown error');
      console.error('[UzhavanAI] Advisor request failed:', advisorError.code, advisorError.message);

      const errorMsg: UIMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        role: 'assistant',
        content: friendlyAdvisorMessage(advisorError, language),
        created_at: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      checkAdvisorHealth().then(setHealth);
    } finally {
      setSending(false);
    }
  }

  async function clearChat() {
    if (!user) return;
    await supabase.from('chat_history').delete().eq('user_id', user.id);
    setMessages([]);
  }

  const statusLabel = health?.state ?? 'CHECKING';
  const statusIsOnline = statusLabel === 'ONLINE';

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-gray-900">AI Advisory</h1>
                {statusLabel && (
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusIsOnline ? 'bg-green-100 text-green-700' : statusLabel === 'CHECKING' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'
                    }`}
                    title={
                      statusIsOnline
                        ? 'Connected to the local UzhavanAI model'
                        : 'The local UzhavanAI model is not reachable or ready'
                    }
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusIsOnline ? 'bg-green-500' : statusLabel === 'CHECKING' ? 'bg-gray-400' : 'bg-amber-500'}`} />
                    {statusLabel}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Your smart farming assistant</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600">
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="card flex-1 overflow-y-auto p-4 lg:p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="font-display text-lg font-semibold text-gray-900">Ask me anything about farming</h2>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              I can help with crop selection, pest management, irrigation, fertilizers, and more.
            </p>
            <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-xl border border-gray-200 px-4 py-3 text-left text-sm text-gray-700 transition-all hover:border-primary-300 hover:bg-primary-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'user' ? 'bg-primary-100 text-primary-600' : msg.isError ? 'bg-amber-100 text-amber-600' : 'bg-gray-800 text-white'
                }`}>
                  {msg.role === 'user' ? (
                    <UserIcon className="h-4 w-4" />
                  ) : msg.isError ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : msg.isError
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 border-t border-gray-200 pt-2">
                      <p className="text-xs font-medium text-gray-500">Sources:</p>
                      <ul className="mt-1 space-y-0.5">
                        {msg.sources.map((s, i) => (
                          <li key={i} className="text-xs text-gray-500">
                            {s.url ? (
                              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                {s.source}
                              </a>
                            ) : (
                              <span>{s.source}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
                  <span className="text-sm text-gray-500">Thinking</span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="mt-4"
      >
        {inputError && <p className="mb-2 text-sm text-error-600">{inputError}</p>}
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); if (inputError) setInputError(null); }}
            placeholder="Type your farming question..."
            className="input-field flex-1"
            disabled={sending}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <button type="submit" disabled={sending || !input.trim()} className="btn-primary px-5">
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
