import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('RentalBackup')
            .select('*')
            .order('rentedAt', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ rentals: data || [] });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rental backup' }, { status: 500 });
    }
}
