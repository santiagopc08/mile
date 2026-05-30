import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { profile, password } = await request.json();

    if (!profile || !password) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const expectedPasswordEl = process.env.PROFILE_EL_PASSWORD;
    const expectedPasswordElla = process.env.PROFILE_ELLA_PASSWORD;

    if (profile === 'el' && password === expectedPasswordEl) {
      return NextResponse.json({ success: true });
    }
    if (profile === 'ella' && password === expectedPasswordElla) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
