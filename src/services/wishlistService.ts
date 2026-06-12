import { supabase as defaultSupabase } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const WishlistService = {


    // === PLANES MODULE: Direct DB methods ===

    async addContribution(
        itemId: string,
        contributor: string,
        amount: number,
        note: string = '',
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        await supabase.from('wishlist_contributions').insert({
            wishlist_item_id: itemId,
            contributor,
            amount,
            note: note || null
        });
        // Update saved_amount on the wishlist item
        const { data: item } = await supabase.from('wishlist').select('saved_amount').eq('id', itemId).single();
        if (item) {
            await supabase.from('wishlist').update({
                saved_amount: (item.saved_amount || 0) + amount
            }).eq('id', itemId);
        }
        // Log activity
        const formatCOP = (v: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
        await supabase.from('wishlist_activity').insert({
            wishlist_item_id: itemId,
            actor: contributor,
            action: 'contributed',
            detail: `+${formatCOP(amount)}`
        });
    },


    async toggleReaction(
        itemId: string,
        reactor: string,
        type: string,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<boolean> {
        const { data: existing } = await supabase
            .from('wishlist_reactions')
            .select('id')
            .eq('wishlist_item_id', itemId)
            .eq('reactor', reactor)
            .eq('type', type)
            .maybeSingle();

        if (existing) {
            await supabase.from('wishlist_reactions').delete().eq('id', existing.id);
            return false; // removed
        } else {
            await supabase.from('wishlist_reactions').insert({
                wishlist_item_id: itemId,
                reactor,
                type
            });
            // Log activity
            await supabase.from('wishlist_activity').insert({
                wishlist_item_id: itemId,
                actor: reactor,
                action: 'reacted',
                detail: type
            });
            return true; // added
        }
    },


    async logWishlistActivity(
        itemId: string | null,
        actor: string,
        action: string,
        detail: string = '',
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        await supabase.from('wishlist_activity').insert({
            wishlist_item_id: itemId,
            actor,
            action,
            detail: detail || null
        });
    },


    async updateWishlistState(
        itemId: string,
        newState: string,
        actor: string,
        supabase: SupabaseClient = defaultSupabase
    ): Promise<void> {
        const { data: item } = await supabase.from('wishlist').select('state').eq('id', itemId).single();
        const oldState = item?.state || 'DISCOVERED';
        await supabase.from('wishlist').update({
            state: newState,
            status: newState === 'COMPLETED' ? 'visited' : 'to-visit'
        }).eq('id', itemId);
        await supabase.from('wishlist_activity').insert({
            wishlist_item_id: itemId,
            actor,
            action: 'state_changed',
            detail: `${oldState} → ${newState}`
        });
    }
};
