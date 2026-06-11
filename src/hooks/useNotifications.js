import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export function timeAgo(isoString) {
  if (!isoString) return '';
  const sec = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (sec < 60)    return `${sec}s ago`;
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function useNotifications() {
  const { user, profile, patientProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const userId   = user?.id;
  const userType = profile ? 'staff' : patientProfile ? 'patient' : null;

  const fetch = useCallback(async () => {
    if (!userId || !userType) return;

    let q = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);

    if (userType === 'staff') {
      q = q.eq('target_type', 'staff');
    } else {
      q = q.eq('target_type', 'patient').eq('target_id', userId);
    }

    const { data } = await q;

    // Inventory alerts are only relevant to admin and nurse
    const INVENTORY_TYPES = ['inventory_low_stock', 'inventory_out_of_stock'];
    const role = profile?.role;
    const filtered = (data || []).filter(n =>
      !INVENTORY_TYPES.includes(n.type) || role === 'admin' || role === 'nurse'
    );
    setNotifications(filtered);
  }, [userId, userType, profile?.role]);

  useEffect(() => {
    if (!userId || !userType) return;

    fetch();

    // Polling fallback — updates every 30s even without Realtime
    const poll = setInterval(fetch, 30_000);

    // Realtime push — instant updates when Realtime is enabled on the table
    let channel;
    let subscribed = false;

    const setupChannel = async () => {
      channel = supabase.channel(`notifs_${userId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetch)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, fetch);
      
      await channel.subscribe();
      subscribed = true;
    };

    setupChannel().catch(() => {
      // Fallback if realtime fails, polling will handle it
      subscribed = false;
    });

    return () => {
      clearInterval(poll);
      if (subscribed && channel) {
        channel.unsubscribe();
      }
    };
  }, [userId, userType, fetch]);

  const markAsRead = useCallback(async (notifId) => {
    if (!userId) return;
    await supabase.rpc('mark_notification_read', { notif_id: notifId });
    setNotifications(prev =>
      prev.map(n =>
        n.id === notifId
          ? { ...n, read_by: [...(n.read_by || []), userId] }
          : n
      )
    );
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase.rpc('mark_all_notifications_read');
    setNotifications(prev =>
      prev.map(n => ({
        ...n,
        read_by: (n.read_by || []).includes(userId)
          ? n.read_by
          : [...(n.read_by || []), userId],
      }))
    );
  }, [userId]);

  const clearOne = useCallback(async (notifId) => {
    if (!userId) return;
    await supabase.rpc('clear_notification', { notif_id: notifId });
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }, [userId]);

  const clearAll = useCallback(async () => {
    if (!userId) return;
    await supabase.rpc('clear_all_notifications');
    setNotifications([]);
  }, [userId]);

  const unreadCount = useMemo(
    () => notifications.filter(n => !(n.read_by || []).includes(userId)).length,
    [notifications, userId]
  );

  return { notifications, unreadCount, markAsRead, markAllAsRead, clearOne, clearAll, refetch: fetch };
}
