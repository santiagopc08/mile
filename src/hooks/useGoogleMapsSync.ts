import { useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import pMap from 'p-map';
import type { WishlistItem } from '@/services/storeService';

export function useGoogleMapsSync(items: WishlistItem[]) {
    const syncGoogleMapsLocation = async (title: string, url: string, state: string, author: string) => {
        if (!url) return;
        const isGoogleMaps = url.includes('google.com/maps') || url.includes('maps.google.com') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('share.google');
        if (!isGoogleMaps) return;

        try {
            const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            if (!res.ok) return;

            const data = await res.json();
            if (data.coords && typeof data.coords.lat === 'number' && typeof data.coords.lng === 'number') {
                const status = (state === 'COMPLETED' || state === 'ARCHIVED') ? 'visited' : 'to-visit';
                const createdBy = author || 'el';

                const { data: existing, error: checkError } = await supabase
                    .from('ubicaciones')
                    .select('id')
                    .eq('nombre', title)
                    .eq('created_by', createdBy);

                if (!checkError && existing && existing.length > 0) {
                    await supabase
                        .from('ubicaciones')
                        .update({
                            latitud: data.coords.lat,
                            longitud: data.coords.lng,
                            status: status
                        })
                        .eq('id', existing[0].id);
                } else {
                    await supabase
                        .from('ubicaciones')
                        .insert({
                            nombre: title,
                            latitud: data.coords.lat,
                            longitud: data.coords.lng,
                            created_by: createdBy,
                            status: status
                        });
                }

                window.dispatchEvent(new CustomEvent('custom:map-refresh'));
            }
        } catch (e) {
            console.error('Error syncing location:', e);
        }
    };

    // Serialized hash of only items with Google Maps URLs and their current state/url,
    // which isolates map backfill checks from other non-map updates.
    const mapItemsHash = useMemo(() => {
        return items
            .filter(item => {
                const url = item.locationUrl;
                if (!url) return false;
                return url.includes('google.com/maps') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps');
            })
            .map(item => `${item.id}:${item.state}:${item.locationUrl}`)
            .join('||');
    }, [items]);

    // Auto-backfill and sync routine for Google Maps items
    useEffect(() => {
        if (items.length === 0) return;

        const performBackfill = async () => {
            try {
                const { data: currentLocations, error } = await supabase.from('ubicaciones').select('*');
                if (error || !currentLocations) return;

                const locationMap = new Map(currentLocations.map(l => [`${l.nombre.toLowerCase()}||${l.created_by}`, l]));
                let mutated = false;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemsToFetchMap = new Map<string, { item: any; url: string; expectedStatus: string }>();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemsToUpdateMap = new Map<string, any>();

                for (const item of items) {
                    const url = item.locationUrl;
                    if (!url) continue;

                    const isGoogleMaps = url.includes('google.com/maps') || url.includes('maps.google.com') || url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('share.google');
                    if (!isGoogleMaps) continue;

                    const key = `${item.title.toLowerCase()}||${item.author}`;
                    const existingPin = locationMap.get(key);
                    const expectedStatus = (item.state === 'COMPLETED' || item.state === 'ARCHIVED') ? 'visited' : 'to-visit';

                    if (!existingPin) {
                        itemsToFetchMap.set(key, { item, url, expectedStatus });
                    } else if (existingPin.status !== expectedStatus) {
                        itemsToUpdateMap.set(key, {
                            id: existingPin.id,
                            nombre: existingPin.nombre,
                            latitud: existingPin.latitud,
                            longitud: existingPin.longitud,
                            created_by: existingPin.created_by,
                            status: expectedStatus
                        });
                    }
                }

                const itemsToFetch = Array.from(itemsToFetchMap.values());
                const itemsToUpdate = Array.from(itemsToUpdateMap.values());

                if (itemsToFetch.length > 0) {
                    // ⚡ Bolt Optimization: Use an in-memory Promise cache to deduplicate concurrent requests
                    // targeting the same URL within the backfill batch.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const urlCache = new Map<string, Promise<any>>();

                    // ⚡ Bolt Optimization: Batch requests to avoid unbounded concurrent fetches
                    // which can exhaust connections, memory, or trigger rate limits.
                    // Using p-map for parallel processing with concurrency limit instead of sequential batches.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const fetchResults: any[] = await pMap(
                        itemsToFetch,
                        ({ item, url, expectedStatus }) => {
                            // ⚡ Bolt Optimization: Replace .map(async () => await asyncOp()) with .map(() => asyncOp().then().catch())
                            // to minimize intermediate promise instantiation overhead
                            let fetchPromise = urlCache.get(url);
                            if (!fetchPromise) {
                                fetchPromise = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`).then(res => {
                                    if (!res.ok) throw new Error('Network response was not ok');
                                    return res.json();
                                });
                                urlCache.set(url, fetchPromise);
                            }

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return fetchPromise.then((resData: any) => {
                                if (resData.coords && typeof resData.coords.lat === 'number' && typeof resData.coords.lng === 'number') {
                                    return {
                                        nombre: item.title,
                                        latitud: resData.coords.lat,
                                        longitud: resData.coords.lng,
                                        created_by: item.author || 'el',
                                        status: expectedStatus
                                    };
                                }
                                return null;
                            }).catch(e => {
                                console.error(`Error fetching coordinates for ${item.title}:`, e);
                                return null;
                            });
                        },
                        { concurrency: 5 }
                    );

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const toInsert = fetchResults.filter(Boolean) as any[];
                    if (toInsert.length > 0) {
                        const { error: insertError } = await supabase.from('ubicaciones').insert(toInsert);
                        if (!insertError) {
                            mutated = true;
                        } else {
                            console.error("Error inserting batch locations details:", insertError);
                        }
                    }
                }

                if (itemsToUpdate.length > 0) {
                    const { error: updateError } = await supabase.from('ubicaciones').upsert(itemsToUpdate);
                    if (!updateError) {
                        mutated = true;
                    } else {
                        console.error("Error updating batch locations details:", updateError);
                    }
                }

                if (mutated) {
                    window.dispatchEvent(new CustomEvent('custom:map-refresh'));
                }
            } catch (err) {
                console.error("Error in auto-backfill:", err);
            }
        };

        const timer = setTimeout(performBackfill, 2000);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapItemsHash]);

    return { syncGoogleMapsLocation };
}
