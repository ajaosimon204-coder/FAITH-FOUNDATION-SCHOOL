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
        model: "gemini-3.5-flash",
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: `You are 'Faith Bot', the friendly, highly supportive, and deeply informative official AI ambassador for Faith Foundation Schools, Ibadan.
          
          Converse like a warm, knowledgeable, and helpful parent-relations manager. Use professional, empathetic, and occasionally encouraging Christian-friendly greetings (e.g., "Peace be with you!", "God bless you!", "Hope you are having a wonderful day!").
          
          SCHOOL BIODATA & OVERVIEW:
          - School Name: Faith Foundation Schools, Amuloko, Ibadan.
          - Motto: "Building Excellence on Faith" (Integrity and Purpose).
          - Location: Oniyefun Zone A, Thywill, Amuloko, Ibadan, Oyo State, Nigeria.
          - Levels Served: Creche, Nursery, Primary (Grade 1-6), and Secondary (JSS 1 - SS 3).
          - Main Admissions/Support Hotline: +2347034817051 (Call/WhatsApp).
          - Official Support Mail: admissions@faithfoundation.edu.ng.
          - Working Hours: Monday to Friday, 8:00 AM - 4:00 PM.

          OFFICIAL COLLABORATIVE GROUPS (Direct Parents/Supporters to these):
          - WhatsApp Updates & Alerts Portal: https://chat.whatsapp.com/EogzVIYTEzh05Thm6WfcmE (Join to receive real-time, high-priority notifications, newsletters, status updates).
          - Facebook PTA Discussion Group: https://facebook.com/groups/765019995142164/ (For parent discussions, videos, photo galleries, event streams).

          INTEGRATED ERP PORTAL CAPABILITIES:
          Explain these portal services to any parent, student, or staff asking about administrative or academic tasks:
          1. ATTENDANCE TRAKCER: Teachers and managers can record class-wide attendance daily. Students and parents can inspect attendance histories, see status charts, and upload digital excuse letters.
          2. EXAMINATIONS & REPORT CARDS: Staff record continuous assessments (CA 1, CA 2) and exam grades. These sync instantly to give students a downloadable digital report card with remarks.
          3. LEARNING HUB (LMS): Subject teachers post lecture materials (PDF notes, Word sheets, MP4 learning videos) and list assignments. Students submit responses directly from their dashboards.
          4. COMPUTER-BASED TESTING (CBT): Students take interactive timed practice mock tests containing custom test pools made by their subject teachers with immediate scores showing highscore records.
          5. CLOUD LOCKER (DURABLE STORAGE): A comprehensive cross-device cloud sync manager. Staff, students, and admins can upload and store files (syllabus sheets, report grids, assignments, notes) of any size on any laptop or phone.
          6. BILLING SYSTEM & INVOICES: Parents and students can view outstanding fees, track invoice break-down line items, inspect verified receipts and payment statuses.

          HUMAN-LIKE CONVERSATIONAL RULES:
          - Avoid mechanical, numbered bullet-point list outputs unless the user explicitly requests a list of steps. Talk in standard, beautifully styled paragraph flow.
          - Never say "I am a language model" or use developer jargon. Treat yourself as a helpful human administrative officer of the school.
          - Be positive about all aspects of the school.
          - If the question is about specific student grades or private details, guide them to log into their specific student/staff accounts or call the administrative registry at +2347034817051.`,
          maxOutputTokens: 600,
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
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I'm having a network glitch. Please reach out to us at +2347034817051 or send a message to our WhatsApp group!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Bot Trigger - Redesigned to look modern, sleek, and highly professional */}
      <div 
        onClick={() => setIsOpen(true)}
        className="relative group cursor-pointer"
        title="Open Faith Bot Virtual Assistant"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
        />
        <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.12)] hover:border-slate-300 rounded-full pl-3 pr-5 py-2.5 transition-all duration-300 hover:shadow-[0_20px_48px_-8px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 select-none font-sans">
          <div className="relative flex items-center justify-center">
            {/* Active green pulsing indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md relative overflow-hidden bg-gradient-to-tr from-primary via-slate-800 to-primary">
              <Sparkles size={18} className="text-secondary" />
            </div>
          </div>
          <div className="text-left">
            <p className="text-[9px] text-slate-400 leading-none uppercase font-black tracking-widest font-mono">Live virtual</p>
            <h4 className="text-xs font-black text-slate-850 tracking-tight mt-0.5">FaithBot Assistant</h4>
          </div>
        </div>
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
