import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        const { data: booth } = await supabase
            .from('Booth')
            .select('name')
            .eq('id', id)
            .single();

        if (!booth) {
            return NextResponse.json({ error: 'Booth not found' }, { status: 404 });
        }

        const { data: rentals, error } = await supabase
            .from('Rental')
            .select('*')
            .eq('boothId', id);

        if (error) throw error;

        if (rentals && rentals.length > 0) {
            // 로스 상태인 우산 목록 조회
            const { data: lostUmbrellas } = await supabase
                .from('UmbrellaLoss')
                .select('umbrellaId')
                .eq('status', 'LOST');

            const lostIds = new Set((lostUmbrellas ?? []).map(l => l.umbrellaId));

            // 로스 우산 제외, RENTED → RETURNED 강제 처리 후 백업
            const now = new Date().toISOString();
            const archiveRows = rentals
                .filter(r => !lostIds.has(r.umbrellaId))
                .map(r => ({
                    id: r.id,
                    umbrellaId: r.umbrellaId,
                    boothId: r.boothId,
                    boothName: booth.name,
                    status: 'RETURNED',
                    rentedAt: r.rentedAt,
                    returnedAt: r.returnedAt ?? now,
                    customData: r.customData ?? {},
                }));

            if (archiveRows.length > 0) {
                const { error: archiveError } = await supabase
                    .from('RentalBackup')
                    .upsert(archiveRows, { onConflict: 'id' });
                if (archiveError) throw archiveError;
            }

            // Rental 전체 삭제
            const { error: deleteError } = await supabase
                .from('Rental')
                .delete()
                .eq('boothId', id);
            if (deleteError) throw deleteError;
        }

        // 우산 상태만 AVAILABLE로 리셋 (부스 활성화/범위 유지)
        await supabase
            .from('Umbrella')
            .update({ status: 'AVAILABLE', updatedAt: new Date().toISOString() })
            .eq('currentBoothId', id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Daily complete error:', error);
        return NextResponse.json({ error: 'Failed to complete daily event' }, { status: 500 });
    }
}
