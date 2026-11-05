import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Brain,
  Bot,
  User,
  Loader2,
  RefreshCw,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export const GeminiChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        '¡Hola! Soy tu Asistente Experto en Control de Inventarios de Barra y Restaurante de BarraExpress.\n\nPuedo ayudarte a:\n• Resolver dudas sobre cómo estandarizar la medición de botellas abiertas en décimos.\n• Analizar causas de merma en coctelería (roturas, degustaciones, sobre-vertido).\n• Ajustar la Ficha Funcional para tu restaurante o preparar el **Prompt Maestro 2**.\n• Diseñar estrategias operativas para que el bartender se enfoque en el servicio y las propinas.\n\n¿En qué te puedo asesorar hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    '¿Cómo capacitar a los bartenders para usar la app en menos de 5 min al cierre?',
    '¿Qué margen de tolerancia de onzas recomiendas para evitar discusiones de mermas?',
    '¿Cómo presentar esta Ficha Funcional en el Prompt Maestro 2?',
    '¿Cómo clasificar botellas en Speed Rail vs Almacén para aplicar la regla 80/20?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          thinkingMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al comunicarse con el servidor.');
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || (thinkingMode ? 'gemini-4-argon' : 'gemini-3.8-flash'),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err.message ||
          'No se pudo conectar con el modelo Gemini. Verifique su API Key en Settings > Secrets.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <span>Copiloto de Control de Inventarios</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {thinkingMode ? 'gemini-4-argon' : 'gemini-3.8-flash'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Asistencia estratégica para reducción de tiempos de barra y Prompt Maestro 2
            </p>
          </div>
        </div>

        {/* High Thinking Mode Toggle */}
        <button
          type="button"
          onClick={() => setThinkingMode(!thinkingMode)}
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
            thinkingMode
              ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm shadow-purple-500/20'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Activa el modelo de razonamiento profundo gemini-4-argon con ThinkingLevel.HIGH"
        >
          <Brain className={`w-3.5 h-3.5 ${thinkingMode ? 'text-purple-400' : 'text-slate-400'}`} />
          <span>Modo Pensamiento Profundo</span>
          <span
            className={`w-2 h-2 rounded-full ${
              thinkingMode ? 'bg-purple-400' : 'bg-slate-600'
            }`}
          />
        </button>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 bg-slate-950 border-x border-slate-800 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-amber-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-4 text-[10px] opacity-75">
                  <span className="font-semibold">{isUser ? 'Tú' : 'Copiloto de Barra'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 rounded-tl-none text-xs text-slate-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span>
                {thinkingMode
                  ? 'Pensando con gemini-4-argon (Razonamiento profundo)...'
                  : 'Generando análisis de inventario...'}
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-slate-950 border-x border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] text-slate-500 shrink-0 font-medium">Sugerencias:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="whitespace-nowrap px-2.5 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-b-2xl p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre control de barra, mermas o la ficha funcional..."
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
