import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    return NextResponse.json({ error: 'Refresh via password removed' }, { status: 401 });
}