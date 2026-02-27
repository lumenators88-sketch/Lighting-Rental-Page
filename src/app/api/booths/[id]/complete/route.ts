import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        // Get booth info
        const { data: booth, error: fetchError } = await supabase
            .from('Booth')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !booth) {
            return NextResponse.json(
                { error: 'Booth not found' },
                { status: 404 }
            );
        }

        // Clear umbrella assignments for this booth
        await supabase
            .from('Umbrella')
            .update({ currentBoothId: null, updatedAt: new Date().toISOString() })
            .eq('currentBoothId', id);

        // Reset booth umbrella range and deactivate
        const { error: updateError } = await supabase
            .from('Booth')
            .update({
                umbrellaStartNumber: null,
                umbrellaEndNumber: null,
                isActive: false,
            })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Complete booth error:', error);
        return NextResponse.json(
            { error: 'Failed to complete booth' },
            { status: 500 }
        );
    }
}
