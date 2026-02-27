import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { updateRentalReturnInNotion } from '@/lib/notion';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { umbrellaId } = body;

        if (!umbrellaId) {
            return NextResponse.json(
                { error: 'Missing umbrellaId' },
                { status: 400 }
            );
        }

        // Find active rental
        const { data: rental, error: fetchError } = await supabase
            .from('Rental')
            .select('*, booth:Booth(*)')
            .eq('umbrellaId', umbrellaId)
            .eq('status', 'RENTED')
            .single();

        if (fetchError || !rental) {
            return NextResponse.json(
                { error: 'No active rental found for this umbrella' },
                { status: 404 }
            );
        }

        const returnedAt = new Date().toISOString();

        // Update rental status
        const { data: updated, error: updateError } = await supabase
            .from('Rental')
            .update({
                status: 'RETURNED',
                returnedAt,
            })
            .eq('id', rental.id)
            .select('*, booth:Booth(*)')
            .single();

        if (updateError) throw updateError;

        // Update Umbrella status back to AVAILABLE
        const umbrellaNumber = parseInt(umbrellaId, 10);
        if (!isNaN(umbrellaNumber)) {
            await supabase
                .from('Umbrella')
                .update({
                    status: 'AVAILABLE',
                    updatedAt: new Date().toISOString()
                })
                .eq('umbrellaNumber', umbrellaNumber);
        }

        // Update Notion in background
        updateRentalReturnInNotion(umbrellaId, new Date(returnedAt)).catch(console.error);

        return NextResponse.json({ success: true, rental: updated });
    } catch (error) {
        console.error('Return API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
