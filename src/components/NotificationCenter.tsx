import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Calendar, FileText, CreditCard, Award, Info } from 'lucide-react';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'assignment': return <FileText className="text-blue-500" size={16} />;
      case 'grade': return <Award className="text-green-500" size={16} />;
      case 'payment': return <CreditCard className="text-purple-500" size={16} />;
      case 'announcement': return <Info className="text-orange-500" size={16} />;
      case 'attendance': return <Calendar className="text-cyan-500" size={16} />;
      default: return <Bell className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-primary transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="text-slate-300" size={24} />
                    </div>
                    <p className="text-xs text-slate-400 font-medium italic">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-4 transition-colors relative group ${notif.read ? 'bg-white opacity-70' : 'bg-primary/5'}`}
                      >
                        <div className="flex gap-3">
                          <div className="shrink-0 mt-1">
                            {getIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1 truncate">{notif.title}</h4>
                            <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">{notif.message}</p>
                            <span className="text-[9px] text-slate-400 mt-2 block font-medium">
                              {formatDistanceToNow(new Date(notif.created_at || new Date()), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                              title="Mark as read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button className="w-full text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                    View All Activity
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
