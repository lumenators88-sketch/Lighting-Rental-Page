import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 전화번호로 대여 중인 우산 조회
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json(
                { error: '전화번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        const { data: rentals, error } = await supabase
            .from('Rental')
            .select('*, booth:Booth(*)')
            .eq('phone', phone)
            .eq('status', 'RENTED')
            .order('rentedAt', { ascending: false });

        if (error) throw error;

        const formattedRentals = rentals?.map(r => ({
            ...r
        }));

        return NextResponse.json({
            success: true,
            rentals: formattedRentals || [],
        });
    } catch (error) {
        console.error('Self-return lookup error:', error);
        return NextResponse.json(
            { error: '조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST: 전화번호 검증 후 반납 처리
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { rentalId, phone } = body;

        if (!rentalId || !phone) {
            return NextResponse.json(
                { error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        // 대여 기록 조회 + 전화번호 일치 확인
        const { data: rental, error: fetchError } = await supabase
            .from('Rental')
            .select('*, booth:Booth(*)')
            .eq('id', rentalId)
            .eq('phone', phone)
            .eq('status', 'RENTED')
            .single();

        if (fetchError || !rental) {
            return NextResponse.json(
                { error: '일치하는 대여 기록이 없습니다. 전화번호를 다시 확인해주세요.' },
                { status: 404 }
            );
        }

        const returnedAt = new Date().toISOString();

        // Rental 상태 업데이트
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

        // Supabase returns standard timestamptz with +00:00 offset

        // Umbrella 상태를 AVAILABLE로 복구
        const umbrellaNumber = parseInt(rental.umbrellaId, 10);
        if (!isNaN(umbrellaNumber)) {
            await supabase
                .from('Umbrella')
                .update({
                    status: 'AVAILABLE',
                    updatedAt: new Date().toISOString(),
                })
                .eq('umbrellaNumber', umbrellaNumber);
        }

        // Notion export는 대여 시점(사전 질문)에만 수행하므로 여기서는 제거

        return NextResponse.json({ success: true, rental: updated });
    } catch (error) {
        console.error('Self-return API error:', error);
        return NextResponse.json(
            { error: '반납 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
