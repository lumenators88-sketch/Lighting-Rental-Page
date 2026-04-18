import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        // 행사 정보 조회
        const { data: booth } = await supabase
            .from('Booth')
            .select('name')
            .eq('id', id)
            .single();

        if (!booth) {
            return NextResponse.json({ error: 'Booth not found' }, { status: 404 });
        }

        // 해당 행사의 Rental 데이터 조회
        const { data: rentals, error } = await supabase
            .from('Rental')
            .select('*')
            .eq('boothId', id);

        if (error) throw error;
        if (!rentals || rentals.length === 0) {
            return NextResponse.json({ success: true, archived: 0 });
        }

        // 로스 상태인 우산 목록 조회
        const { data: lostUmbrellas } = await supabase
            .from('UmbrellaLoss')
            .select('umbrellaId')
            .eq('status', 'LOST');

        const lostIds = new Set((lostUmbrellas ?? []).map(l => l.umbrellaId));

        // 로스 우산 제외하고 RentalBackup에 복사, RENTED는 RETURNED로 강제 처리
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

        const { error: archiveError } = await supabase
            .from('RentalBackup')
            .upsert(archiveRows, { onConflict: 'id' });

        if (archiveError) throw archiveError;

        return NextResponse.json({ success: true, archived: archiveRows.length });
    } catch (error) {
        console.error('Archive error:', error);
        return NextResponse.json({ error: 'Failed to archive rentals' }, { status: 500 });
    }
}
