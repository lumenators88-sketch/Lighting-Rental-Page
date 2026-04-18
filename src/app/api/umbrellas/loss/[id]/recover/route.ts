import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        const { data, error } = await supabase
            .from('UmbrellaLoss')
            .update({ status: 'RECOVERED', recoveredAt: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, loss: data });
    } catch (error) {
        console.error('Recover API error:', error);
        return NextResponse.json({ error: 'Failed to recover umbrella' }, { status: 500 });
    }
}
