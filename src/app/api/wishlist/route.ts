import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { WishlistService } from '@/services/wishlistService';
import { NotificationService } from '@/services/notificationService';
import { STATE_CONFIG } from '@/components/planes/constants';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, itemId, profile } = body;
        const supabase = createServerClient();

        if (action === 'state_transition') {
            const { nextState } = body;
            
            // 1. Fetch item to check if it's shared and get current details
            const { data: item, error: fetchError } = await supabase
                .from('wishlist')
                .select('*')
                .eq('id', itemId)
                .single();
                
            if (fetchError || !item) {
                return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            }

            // 2. Perform state update
            await WishlistService.updateWishlistState(itemId, nextState, profile, supabase);

            // 3. Send notification if shared
            if (item.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                if (nextState === 'COMPLETED') {
                    await NotificationService.addNotification(target, 'wishlist', `¡Objetivo Cumplido! Completamos el plan: "${item.title}" 🎉`, supabase);
                } else {
                    const stateLabel = STATE_CONFIG[nextState as keyof typeof STATE_CONFIG]?.label || nextState;
                    await NotificationService.addNotification(target, 'wishlist', `¡${authorName} actualizó el plan "${item.title}" a estado: ${stateLabel}!`, supabase);
                }
            }

            return NextResponse.json({ success: true });
        }

        if (action === 'contribute') {
            const { amount, note } = body;
            
            // 1. Fetch item details
            const { data: item, error: fetchError } = await supabase
                .from('wishlist')
                .select('*')
                .eq('id', itemId)
                .single();
                
            if (fetchError || !item) {
                return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            }

            // 2. Add contribution
            await WishlistService.addContribution(itemId, profile, amount, note, supabase);

            // 3. Auto-transition to SAVING if still DISCOVERED
            let currentState = item.state || 'DISCOVERED';
            if (currentState === 'DISCOVERED') {
                await WishlistService.updateWishlistState(itemId, 'SAVING', profile, supabase);
                currentState = 'SAVING';
            }

            // 4. Check if ready
            const newSavedAmount = (item.saved_amount || 0) + amount;
            if (newSavedAmount >= item.price && item.price > 0 && currentState === 'SAVING') {
                await WishlistService.updateWishlistState(itemId, 'READY_TO_DEPLOY', profile, supabase);
            }

            // 5. Send notification if shared
            if (item.shared) {
                const target = profile === 'el' ? 'ella' : 'el';
                const authorName = profile === 'el' ? 'Santiago' : 'Milena';
                const formatCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
                const amountFormatted = formatCOP(amount);
                await NotificationService.addNotification(target, 'wishlist', `¡${authorName} aportó ${amountFormatted} al plan: "${item.title}"! 💰`, supabase);
            }

            return NextResponse.json({ success: true });
        }

        if (action === 'reaction') {
            const { type } = body;
            await WishlistService.toggleReaction(itemId, profile, type, supabase);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in wishlist API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
