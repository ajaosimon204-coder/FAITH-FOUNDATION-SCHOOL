import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Send, Users, User, Clock, AlertCircle, MessageSquare } from 'lucide-react';

interface CommunicationMessage {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  subject: string;
  body: string;
  is_broadcast: boolean;
  target_role: string | null;
  created_at: string;
  sender_profile?: { full_name: string; role: string };
  receiver_profile?: { full_name: string; role: string };
}

export default function Communications() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [targetType, setTargetType] = useState<'broadcast' | 'direct'>('direct');
  const [targetRole, setTargetRole] = useState('all');
  const [receiverId, setReceiverId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [userList, setUserList] = useState<{ id: string; full_name: string; role: string }[]>([]);

  useEffect(() => {
    fetchMessages();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, role')
      .neq('id', profile?.id);
    if (data) setUserList(data);
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:users!sender_id(full_name, role),
          receiver_profile:users!receiver_id(full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!body || !subject) return setError("Subject and message body are required.");

    const isBroadcast = targetType === 'broadcast';
    if (!isBroadcast && !receiverId) return setError("Please select a recipient.");

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: profile?.id,
        receiver_id: isBroadcast ? null : receiverId,
        subject,
        body,
        is_broadcast: isBroadcast,
        target_role: isBroadcast ? targetRole : null
      });

      if (error) throw error;

      setSubject('');
      setBody('');
      setTargetType('direct');
      setReceiverId('');
      fetchMessages();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredUsers = userList.filter(u => 
    u.full_name?.toLowerCase().includes(searchTarget.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTarget.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Compose Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 md:col-span-1 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Send size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Compose</h2>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="space-y-5">
            {profile?.role !== 'student' && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-widest block">Message Type</label>
                <div className="flex bg-slate-50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTargetType('direct')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${targetType === 'direct' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Direct Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('broadcast')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${targetType === 'broadcast' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Broadcast
                  </button>
                </div>
              </div>
            )}

            {targetType === 'broadcast' && profile?.role !== 'student' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-widest block">Target Audience</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="all">All School</option>
                  <option value="student">Students & Parents</option>
                  <option value="staff">Staff Only</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2 relative">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-widest block">Select Recipient</label>
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                >
                  <option value="" disabled>-- Select Recipient --</option>
                  {filteredUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest block">Subject</label>
              <input 
                type="text" 
                placeholder="Message Subject..."
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest block">Message Body</label>
              <textarea 
                placeholder="Write your message here..."
                rows={5}
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 resize-none"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <Send size={16} /> Send Message
            </button>
          </form>
        </div>

        {/* Inbox / History Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 md:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Message History</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-slate-400 font-medium animate-pulse">Loading Messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                  <MessageSquare size={24} />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight mb-1">No Messages</h3>
                <p className="text-sm text-slate-500">You haven't sent or received any messages yet.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === profile?.id;
                return (
                  <div key={msg.id} className={`p-6 rounded-2xl border transition-all ${isMine ? 'border-primary/20 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase overflow-hidden">
                          {msg.sender_profile?.full_name?.[0] || <User size={16} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {msg.sender_profile?.full_name || 'Unknown Sender'}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                            {msg.is_broadcast ? (
                              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">Broadcast to {msg.target_role}</span>
                            ) : isMine ? (
                              `To: ${msg.receiver_profile?.full_name || 'Unknown'}`
                            ) : (
                              `Direct Message`
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-slate-400 flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <Clock size={12} />
                        {new Date(msg.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="pl-12">
                      <h4 className="font-bold text-sm text-slate-800 mb-2">{msg.subject}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
