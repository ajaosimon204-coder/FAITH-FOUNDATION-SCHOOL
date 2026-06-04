import React from 'react';
import { supabase } from '../lib/supabase';
import { NotificationType } from '../lib/notifications';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loading: boolean;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isSandbox } = useAuth();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    if (!user || isSandbox) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
      } catch (err: any) {
        const msg = err?.message || String(err) || '';
        const errStr = (String(err) + ' ' + msg + ' ' + (typeof err === 'object' ? JSON.stringify(err) : '')).toLowerCase();
        const isNetworkError = 
          errStr.includes('fetch') ||
          errStr.includes('network') ||
          errStr.includes('connection') ||
          errStr.includes('dns') ||
          errStr.includes('load failed') ||
          errStr.includes('offline');

        if (isNetworkError) {
          console.warn('Notifications fetch warning (network error):', msg);
        } else {
          console.error('Error fetching notifications:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    let notificationsChannel: any = null;
    try {
      notificationsChannel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    } catch (e) {
      console.error('Error establishing user-notifications subscription channel:', e);
    }

    return () => {
      if (notificationsChannel) {
        try {
          supabase.removeChannel(notificationsChannel);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [user, isSandbox]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, deleteNotification, loading }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
