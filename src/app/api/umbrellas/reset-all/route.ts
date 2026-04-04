import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
    try {
        const { error } = await supabase
            .from('Umbrella')
            .update({ currentBoothId: null, status: 'AVAILABLE', updatedAt: new Date().toISOString() })
            .neq('status', 'AVAILABLE'); // Only update non-AVAILABLE ones

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reset all umbrellas error:', error);
        return NextResponse.json(
            { error: 'Failed to reset umbrellas' },
            { status: 500 }
        );
    }
}
