import { NextResponse } from 'next/server';
import { StoreService } from '@/services/storeService';
import { verifyServerSession } from '@/lib/auth-utils';
import { createServerClient } from '@/lib/supabase-server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { searchParams } = new URL(request.url);
        const tablesStr = searchParams.get('tables');
        const tables = tablesStr ? tablesStr.split(',') : null;

        const supabase = createServerClient();
        const data = await StoreService.getStore(supabase, tables);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch store data' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json();
        const supabase = createServerClient();
        await StoreService.updateStore(body, supabase);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update store data' }, { status: 500 });
    }
}
