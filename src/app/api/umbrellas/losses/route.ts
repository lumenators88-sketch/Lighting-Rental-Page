import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('UmbrellaLoss')
            .select('*')
            .order('lostAt', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ losses: data || [] });
    } catch (error) {
        console.error('Losses API error:', error);
        return NextResponse.json({ error: 'Failed to fetch losses' }, { status: 500 });
    }
}
