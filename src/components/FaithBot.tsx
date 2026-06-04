import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function FaithBot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'model', text: 'Peace be with you! I am Faith Bot. How can I assist you with Faith Foundation Schools today?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const apiKey = (process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY) as string;
  const ai = React.useMemo(() => {
    // Check if key exists and isn't just a placeholder string
    if (!apiKey || apiKey === 'null' || apiKey === 'undefined' || apiKey === '' || apiKey.length < 10) {
      return null;
    }
    try {
      return new GoogleGenAI({ apiKey });
    } catch (err: any) {
      const errStr = String(err).toLowerCase();
      if (errStr.includes('api key') || errStr.includes('fetch') || errStr.includes('network') || errStr.includes('connection')) {
        console.warn("FaithBot: API connection issue on initialization", err);
      } else {
        console.error("FaithBot: Failed to initialize AI", err);
      }
      return null;
    }
  }, [apiKey]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !ai) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: `You are 'Faith Bot', the official AI ambassador for Faith Foundation Schools, Ibadan. 
          
          SCHOOL DETAILS:
          - Location: Oniyefun Zone A, Thywill, Amuloko, Ibadan, Oyo State, Nigeria.
          - Principal/Director: The school is a faith-based institution focused on integrity and purpose.
          - Classes: Creche, Nursery, Primary (Grade 1-6), and Secondary (JSS 1 - SS 3).
          - Contact: +2347034817051 (Registrar/Admissions).
          - Curriculum: Nigerian National Curriculum with strong emphasis on moral and spiritual growth.
          - Motto: Integrity and Purpose.
          
          GUIDELINES:
          - Be warm, encouraging, and professional. Use Christian-friendly greetings like "God bless you" or "Peace be with you" occasionally.
          - For admissions: Direct them to the Admissions page or call +2347034817051.
          - For fees: Tell them to check the Student Portal or contact the Bursar.
          - If you are unsure or the question is too specific: Kindly suggest they call the school directly at +2347034817051.
          - Keep responses concise (max 3 sentences) unless more detail is needed.`,
          maxOutputTokens: 500,
        }
      });

      const modelResponse = response.text || "I apologize, I'm having trouble connecting to the school servers right now. Please try again or contact us directly at +2347034817051.";
      setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error: any) {
      const errStr = String(error).toLowerCase();
      if (errStr.includes('fetch') || errStr.includes('network') || errStr.includes('connection') || errStr.includes('api key')) {
        console.warn('Chat network or connection notice:', error?.message || String(error));
      } else {
        console.error('Chat error:', error);
      }
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please reach out to us at +2347034817051." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Bot Trigger */}
      <div className="relative group">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-accent rounded-full opacity-20 blur-xl"
        />
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-gradient-to-br from-accent via-accent to-secondary text-primary rounded-full shadow-[0_10px_30px_-5px_rgba(255,204,0,0.5)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all relative border-2 border-white/40"
          title="Chat with Faith Bot"
        >
          <Sparkles className="absolute -top-1 -right-1 text-secondary drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-bounce" size={20} />
          <MessageSquare size={32} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-24 right-8 w-80 sm:w-96 bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-100 z-[100] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none">Faith Bot</h3>
                  <p className="text-[10px] text-blue-200 mt-1 flex items-center gap-1 uppercase tracking-widest font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${ai ? 'bg-green-400 animate-pulse' : 'bg-rose-400'}`} />
                    {ai ? 'Online Assistant' : 'AI Offline (No Key)'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar max-h-[400px] bg-slate-50"
            >
              {!ai && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-[10px] text-rose-600 font-bold uppercase tracking-wider text-center">
                  Notice: Gemini API Key not found. Please set VITE_GEMINI_API_KEY in your Netlify settings to enable Faith Bot.
                </div>
              )}
              {messages.map((m, idx) => (
                <div 
                  key={idx}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] ${m.role === 'user' ? 'bg-primary text-white' : 'bg-accent text-primary'}`}>
                      {m.role === 'user' ? <User size={12} /> : <MessageSquare size={12} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2 items-center bg-slate-100 rounded-2xl px-4 py-1">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Faith Bot something..."
                  className="w-full bg-transparent border-none focus:outline-none text-xs py-3 font-medium"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 text-center mt-3 font-medium italic">
                Faith Bot may use AI to generate responses.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
