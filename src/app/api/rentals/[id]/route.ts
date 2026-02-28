import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { umbrellaId, phone, status } = body;

        // Fetch existing
        const { data: existing, error: fetchError } = await supabase
            .from('Rental')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json(
                { error: '대여 기록을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const updates: any = {};
        let newReturnedAt = existing.returnedAt;

        if (phone !== undefined) updates.phone = phone;

        // Handle Umbrella Change
        if (umbrellaId !== undefined && umbrellaId !== existing.umbrellaId) {
            updates.umbrellaId = umbrellaId;

            // Mark old umbrella available if it was rented by this record
            if (existing.status === 'RENTED') {
                const oldNumber = parseInt(existing.umbrellaId, 10);
                if (!isNaN(oldNumber)) {
                    await supabase
                        .from('Umbrella')
                        .update({ status: 'AVAILABLE', updatedAt: new Date().toISOString() })
                        .eq('umbrellaNumber', oldNumber);
                }

                // Mark new umbrella rented
                const newNumber = parseInt(umbrellaId, 10);
                if (!isNaN(newNumber)) {
                    await supabase
                        .from('Umbrella')
                        .update({ status: 'RENTED', currentBoothId: existing.boothId, updatedAt: new Date().toISOString() })
                        .eq('umbrellaNumber', newNumber);
                }
            }
        }

        // Handle Status Change
        if (status !== undefined && status !== existing.status) {
            updates.status = status;

            const umbrellaNumber = parseInt(updates.umbrellaId || existing.umbrellaId, 10);

            if (status === 'RETURNED') {
                newReturnedAt = new Date().toISOString();
                updates.returnedAt = newReturnedAt;

                if (!isNaN(umbrellaNumber)) {
                    await supabase
                        .from('Umbrella')
                        .update({ status: 'AVAILABLE', updatedAt: new Date().toISOString() })
                        .eq('umbrellaNumber', umbrellaNumber);
                }
            } else if (status === 'RENTED') {
                updates.returnedAt = null;
                newReturnedAt = null;

                if (!isNaN(umbrellaNumber)) {
                    await supabase
                        .from('Umbrella')
                        .update({ status: 'RENTED', currentBoothId: existing.boothId, updatedAt: new Date().toISOString() })
                        .eq('umbrellaNumber', umbrellaNumber);
                }
            }
        }

        const { data: updated, error: updateError } = await supabase
            .from('Rental')
            .update(updates)
            .eq('id', id)
            .select('*, booth:Booth(*)')
            .single();

        if (updateError) throw updateError;

        // Ensure timezone consistency
        if (updated.rentedAt && !updated.rentedAt.endsWith('Z')) {
            updated.rentedAt += 'Z';
        }
        if (updated.returnedAt && !updated.returnedAt.endsWith('Z')) {
            updated.returnedAt += 'Z';
        }

        return NextResponse.json({ success: true, rental: updated });

    } catch (error) {
        console.error('Update Rental API error:', error);
        return NextResponse.json(
            { error: '수정 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
