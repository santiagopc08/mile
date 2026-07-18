import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
    if (!(await verifyAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = createServerClient();
    
    // Test tasks
    const { error: tasksError } = await supabase.from('tasks').upsert([{
        id: crypto.randomUUID(),
        text: "Test Task",
        status: "pending",
        category: "work",
        priority: "medium",
        estimated_time: 30,
        actual_time: 0,
        actions: [],
        validations: [],
        detail: "test",
        updated_at: new Date().toISOString()
    }]);

    // Test objectives
    const { error: objError } = await supabase.from('objectives').upsert([{
        id: crypto.randomUUID(),
        title: "Test Obj",
        author: "el",
        is_complete: false,
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString()
    }]);

    return NextResponse.json({
        tasksError,
        objError
    });
}
