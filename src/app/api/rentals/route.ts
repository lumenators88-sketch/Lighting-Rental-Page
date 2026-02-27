import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: rentals, error } = await supabase
            .from('Rental')
            .select('*, booth:Booth(name)')
            .order('rentedAt', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ rentals });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch rentals' },
            { status: 500 }
        );
    }
}
