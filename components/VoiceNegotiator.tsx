
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Mic, MicOff, User, Bot, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { TranscriptionItem } from '../types';

const VoiceNegotiator: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isStoppingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions, currentInput, currentOutput]);

  const buildPrompt = (userText: string) => {
    return `You are "Mandi Mediator" - an AI assistant helping Indian agricultural traders negotiate prices.

User said: ${userText}

Respond concisely (2-4 sentences). If a commodity is mentioned, provide a fair price range and a negotiation tip. If the user speaks in a regional language, translate and respond in English but keep it simple.`;
  };

  const speak = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-IN';
      utter.rate = 1.0;
      utter.onstart = () => setStatus('speaking');
      utter.onend = () => setStatus('listening');
      synth.speak(utter);
    } catch {
      // ignore speech errors
    }
  };

  const generateResponse = async (userText: string) => {
    try {
      setStatus('connecting');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key is not configured. Please set VITE_GEMINI_API_KEY in .env.local');
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: buildPrompt(userText) }] }],
      });
      const outputText = response.text || 'I could not generate a response right now.';

      setCurrentOutput(outputText);
      setTranscriptions(prev => [
        ...prev,
        { speaker: 'user', text: userText, timestamp: Date.now() },
        { speaker: 'model', text: outputText, timestamp: Date.now() },
      ]);
      setCurrentInput('');

      speak(outputText);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
      setStatus('idle');
    }
  };

  const startRecognition = () => {
    const SpeechRecognitionClass: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setErrorMsg('Speech Recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN';

    recognition.onstart = () => {
      setStatus('listening');
      setErrorMsg(null);
    };

    recognition.onerror = (event: any) => {
      setErrorMsg(`Speech recognition error: ${event.error || 'unknown error'}`);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (interimTranscript) {
        setCurrentInput(interimTranscript.trim());
      }
      if (finalTranscript.trim().length > 0) {
        const cleaned = finalTranscript.trim();
        setCurrentInput(cleaned);
        generateResponse(cleaned);
      }
    };

    recognition.onend = () => {
      if (!isStoppingRef.current && isActive) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const startSession = () => {
    setIsActive(true);
    setTranscriptions([]);
    setCurrentInput('');
    setCurrentOutput('');
    setErrorMsg(null);
    startRecognition();
  };

  const stopSession = () => {
    isStoppingRef.current = true;
    setIsActive(false);
    setStatus('idle');
    setCurrentInput('');
    setCurrentOutput('');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setTimeout(() => {
      isStoppingRef.current = false;
    }, 300);
  };

  const toggleSession = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Live Negotiator</h2>
              <p className="text-sm text-slate-500">Talk in your language, negotiate like a pro</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status !== 'idle' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'listening' ? 'bg-green-500 animate-pulse' :
                  status === 'speaking' ? 'bg-blue-500 animate-bounce' :
                  'bg-amber-500'
                }`}></div>
                <span className="text-sm font-medium text-indigo-700 capitalize">{status}</span>
              </div>
            )}
            <button
              onClick={toggleSession}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                isActive 
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {isActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isActive ? 'End Session' : 'Start Negotiating'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Conversation Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isActive && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-12">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2">
              <MessageCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Start Your Linguistic Bridge</h3>
            <p className="text-slate-500 max-w-sm">
              Speak in your local language (Hindi, Punjabi, Marathi, Tamil, Bengali, etc.) and our AI mediator will translate, provide negotiation tips, and assist your trading.
            </p>
          </div>
        )}

        {transcriptions.map((t, i) => (
          <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex items-start gap-3 ${t.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                t.speaker === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {t.speaker === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                t.speaker === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{t.text}</p>
              </div>
            </div>
          </div>
        ))}

        {currentInput && (
          <div className="flex justify-end animate-in fade-in slide-in-from-right-2">
            <div className="max-w-[80%] flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                <User className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-indigo-700 italic rounded-tr-none">
                <p className="text-sm">{currentInput}...</p>
              </div>
            </div>
          </div>
        )}

        {currentOutput && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
            <div className="max-w-[80%] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center border border-indigo-100">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-indigo-100 text-slate-700 rounded-tl-none">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                  <span className="text-[10px] uppercase font-bold text-indigo-400">Mediating</span>
                </div>
                <p className="text-sm">{currentOutput}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visualizer Footer */}
      {isActive && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
          <div className="flex-1 h-8 flex items-center justify-center gap-1">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-indigo-500 rounded-full transition-all duration-100 ${
                  status === 'listening' ? 'h-2 animate-pulse' : 
                  status === 'speaking' ? 'h-full animate-bounce' : 'h-1'
                }`}
                style={{
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Live Mediating
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceNegotiator;
