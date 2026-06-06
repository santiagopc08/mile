import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
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
        const { target, message, type } = await request.json();

        if (!target || !message) {
            return NextResponse.json({ error: 'Missing target or message' }, { status: 400 });
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

        // 3. Send in parallel to all active subscriptions
        const sendPromises = subscriptions.map(async (subRecord: any) => {
            try {
                await webpush.sendNotification(subRecord.subscription, payload);
            } catch (err: any) {
                // If endpoint is no longer valid (status 410 Gone or 404 Not Found), remove it
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`Removing expired subscription: ${subRecord.endpoint}`);
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('id', subRecord.id);
                } else {
                    console.error(`Error sending push notification to ${subRecord.endpoint}:`, err);
                }
            }
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, sent: subscriptions.length });

    } catch (err: any) {
        console.error('Error in send push API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
