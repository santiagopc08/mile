import { NextResponse } from 'next/server';
import { StoreService } from '@/services/storeService';
import { TimelineService } from '@/services/timelineService';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, ...payload } = body;
        const supabase = createServerClient();

        if (action === 'comment') {
            await TimelineService.addEventComment(
                {
                    eventId: payload.eventId,
                    author: payload.author,
                    text: payload.text
                },
                supabase
            );
            return NextResponse.json({ success: true });
        }

        if (action === 'react') {
            await TimelineService.reactToEvent(
                payload.id,
                payload.reactions,
                supabase
            );
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error("Failed to process timeline POST:", error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type'); // 'comment'
        const supabase = createServerClient();

        if (!id) {
            return NextResponse.json({ error: 'ID parameter required' }, { status: 400 });
        }

        if (type === 'comment') {
            await TimelineService.deleteEventComment(id, supabase);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to process timeline DELETE:", error);
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }
}
