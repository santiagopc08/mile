import { useState, useEffect, useRef, useMemo } from 'react';
import { NotificationService } from '@/services/notificationService';
import { supabase } from '@/lib/supabase';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export function useNotifications(profile: string | null) {
    const [notifications, setNotifications] = useState<Record<string, any>>({});

    const isInitialLoadRef = useRef(true);
    const notifiedIdsRef = useRef<Set<string>>(new Set());

    const notificationsArray = useMemo(() => Object.values(notifications).sort(
        (a, b) => b.created_at.localeCompare(a.created_at)
    ), [notifications]);

    let unreadCount = 0;
    for (let i = 0; i < notificationsArray.length; i++) {
        if (!notificationsArray[i].read) unreadCount++;
    }

    const subscribeToPushNotifications = async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidPublicKey) {
                    console.warn('VAPID public key is not set in environment variables.');
                    return;
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });
            }

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    profile: profile,
                    subscription: subscription.toJSON(),
                    endpoint: subscription.endpoint
                }, {
                    onConflict: 'endpoint'
                });

            if (error) {
                console.error('Failed to save push subscription to Supabase:', error);
            }
        } catch (err) {
            console.error('Failed to subscribe to push notifications:', err);
        }
    };

    const requestPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                try {
                    await Notification.requestPermission();
                } catch (err) {
                    console.warn('Failed to request notification permission:', err);
                }
            }
        }
    };

    const fetchNotifications = async () => {
        if (!profile) return;
        try {
            const data = await NotificationService.getNotifications(profile);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const next: Record<string, any> = {};
            if (data) {
                for (const n of data) {
                    next[(n as any).id] = n;
                }
            }
            setNotifications(next);

            if (data && data.length > 0 && isInitialLoadRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.forEach((n: any) => notifiedIdsRef.current.add(n.id));
                isInitialLoadRef.current = false;
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const triggerDesktopNotification = (n: any) => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification('Nuestro Espacio', {
                    body: n.message,
                    icon: '/icon-192.png',
                    tag: n.id
                });
            } catch (e) {
                console.error('Failed to trigger native desktop notification:', e);
            }
        }
    };

    useEffect(() => {
        if (!profile) return;

        const initNotifications = async () => {
            await requestPermission();
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                await subscribeToPushNotifications();
            }
        };

        initNotifications();
        fetchNotifications();

        const channel = supabase
            .channel(`realtime-notifications-${profile}-${crypto.randomUUID()}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `target_profile=eq.${profile}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new;
                        setNotifications((prev) => ({ ...prev, [newNotif.id]: newNotif }));

                        if (!notifiedIdsRef.current.has(newNotif.id)) {
                            notifiedIdsRef.current.add(newNotif.id);
                            triggerDesktopNotification(newNotif);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications((prev) => {
                            if (!prev[payload.new.id]) return prev;
                            return { ...prev, [payload.new.id]: payload.new };
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications((prev) => {
                            if (!prev[payload.old.id]) return prev;
                            const next = { ...prev };
                            delete next[payload.old.id];
                            return next;
                        });
                    }
                }
            )
            .subscribe();

        const fallbackInterval = setInterval(fetchNotifications, 90000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(fallbackInterval);
        };
    }, [profile]);

    const handleRead = async (id: string) => {
        try {
            await NotificationService.markNotificationRead(id);
            setNotifications(prev => {
                if (!prev[id]) return prev;
                return { ...prev, [id]: { ...prev[id], read: true } };
            });
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    };

    const handleMarkAllRead = async () => {
        if (!profile) return;
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('target_profile', profile)
                .eq('read', false);

            setNotifications(prev => {
                const next: Record<string, any> = {};
                for (const key in prev) {
                    next[key] = { ...prev[key], read: true };
                }
                return next;
            });
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const handleClearAll = async () => {
        if (!profile) return;
        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('target_profile', profile);
            setNotifications({});
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    };

    return {
        notificationsArray,
        unreadCount,
        handleRead,
        handleMarkAllRead,
        handleClearAll
    };
}
