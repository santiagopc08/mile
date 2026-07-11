import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import webpush from 'web-push';

// Configure Web Push with our VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:admin@mile.app',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: Request) {
    try {
        if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { target, message, type } = await request.json();

        if (!target || !message) {
            return NextResponse.json({ error: 'Missing target or message' }, { status: 400 });
        }

        if (typeof target !== 'string' || typeof message !== 'string' || (type !== undefined && typeof type !== 'string')) {
            return NextResponse.json({ error: 'Invalid input types' }, { status: 400 });
        }

        if (target.length > 50 || message.length > 1000 || (type && type.length > 50)) {
            return NextResponse.json({ error: 'Input exceeds maximum length' }, { status: 400 });
        }

        if (!vapidPublicKey || !vapidPrivateKey) {
            console.error('VAPID keys are missing from server environment.');
            return NextResponse.json({ error: 'Push service not configured' }, { status: 500 });
        }

        const supabase = createServerClient();

        // 1. Fetch subscriptions for the target profile
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('profile', target);

        if (error) {
            console.error('Failed to fetch subscriptions:', error);
            return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions found for target' });
        }

        // 2. Prepare payload
        const payload = JSON.stringify({
            title: 'Nuestro Espacio',
            body: message,
            url: target === 'ella' ? '/salud' : '/planes',
            type
        });

        // 3. Send in batches to all active subscriptions to avoid rate limiting
        const BATCH_SIZE = 50;
        for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
            const sendPromises: Promise<any>[] = [];
            const endBatch = Math.min(i + BATCH_SIZE, subscriptions.length);

            for (let j = i; j < endBatch; j++) {
                const subRecord = subscriptions[j] as Record<string, unknown>;
                const sendPromise = webpush.sendNotification(subRecord.subscription as webpush.PushSubscription, payload)
                    .catch(async (err: unknown) => {
                        // If endpoint is no longer valid (status 410 Gone or 404 Not Found), remove it
                        const errorObj = err as Record<string, unknown>;
                        if (errorObj.statusCode === 410 || errorObj.statusCode === 404) {
                            await supabase
                                .from('push_subscriptions')
                                .delete()
                                .eq('id', subRecord.id);
                        } else {
                            console.error(`Error sending push notification to ${subRecord.endpoint}:`, err);
                        }
                    });

                sendPromises.push(sendPromise);
            }

            await Promise.all(sendPromises);
        }

        return NextResponse.json({ success: true, sent: subscriptions.length });

    } catch (err: unknown) {
        console.error('Error in send push API:', err);
        return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 });
    }
}
