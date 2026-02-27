import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const body = await request.json();
        const { isActive, name, photoUrl, umbrellaStartNumber, umbrellaEndNumber } = body;

        const updates: any = {};
        if (isActive !== undefined) updates.isActive = isActive;
        if (name) updates.name = name;
        if (photoUrl) updates.photoUrl = photoUrl;
        if (umbrellaStartNumber !== undefined) updates.umbrellaStartNumber = umbrellaStartNumber;
        if (umbrellaEndNumber !== undefined) updates.umbrellaEndNumber = umbrellaEndNumber;

        const { data: updated, error } = await supabase
            .from('Booth')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // If umbrella range was updated, sync Umbrella table
        if (umbrellaStartNumber !== undefined && umbrellaEndNumber !== undefined) {
            // Clear previous assignment for this booth
            await supabase
                .from('Umbrella')
                .update({ currentBoothId: null, updatedAt: new Date().toISOString() })
                .eq('currentBoothId', id);

            // Assign new range to this booth
            await supabase
                .from('Umbrella')
                .update({ currentBoothId: id, updatedAt: new Date().toISOString() })
                .gte('umbrellaNumber', umbrellaStartNumber)
                .lte('umbrellaNumber', umbrellaEndNumber);
        }

        return NextResponse.json({ success: true, booth: updated });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to update booth' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        const { error } = await supabase
            .from('Booth')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete booth' },
            { status: 500 }
        );
    }
}
