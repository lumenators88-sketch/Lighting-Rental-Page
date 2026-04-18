import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { umbrellaId, boothId, boothName } = body;

        if (!umbrellaId) {
            return NextResponse.json({ error: 'Missing umbrellaId' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('UmbrellaLoss')
            .insert([{ umbrellaId, boothId: boothId || null, boothName: boothName || null, status: 'LOST' }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, loss: data });
    } catch (error) {
        console.error('Loss API error:', error);
        return NextResponse.json({ error: 'Failed to record loss' }, { status: 500 });
    }
}
