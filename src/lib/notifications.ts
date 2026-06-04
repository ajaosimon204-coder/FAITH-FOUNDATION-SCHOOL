import { supabase, isSupabaseConfigured } from './supabase';

export type NotificationType = 'assignment' | 'grade' | 'payment' | 'announcement' | 'attendance';

export interface CreateNotificationParams {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export async function sendNotification({
  recipientId,
  title,
  message,
  type,
  link
 }: CreateNotificationParams) {
  if (!isSupabaseConfigured) {
    console.warn('Cannot send notification: Supabase not configured');
    return;
  }
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        title,
        message,
        type,
        link: link || null,
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
