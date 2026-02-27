import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addRentalRecordToNotion } from '@/lib/notion';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { umbrellaId, phone, boothId } = body;

        if (!umbrellaId || !phone || !boothId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if umbrella is already rented
        const { data: existing } = await supabase
            .from('Rental')
            .select('*')
            .eq('umbrellaId', umbrellaId)
            .eq('status', 'RENTED')
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'Umbrella is already rented' },
                { status: 400 }
            );
        }

        // Check if booth exists
        const { data: booth } = await supabase
            .from('Booth')
            .select('*')
            .eq('id', boothId)
            .single();

        if (!booth) {
            return NextResponse.json(
                { error: 'Booth not found' },
                { status: 404 }
            );
        }

        // 1. Check if Umbrella exists, is available, and belongs to this booth's range
        const umbrellaNumber = parseInt(umbrellaId, 10);
        if (isNaN(umbrellaNumber)) {
            return NextResponse.json(
                { error: 'Invalid umbrella number format' },
                { status: 400 }
            );
        }

        // Ensure umbrella belongs to the booth's allocated range
        if (booth.umbrellaStartNumber && booth.umbrellaEndNumber) {
            if (umbrellaNumber < booth.umbrellaStartNumber || umbrellaNumber > booth.umbrellaEndNumber) {
                return NextResponse.json(
                    { error: `이 행사에는 ${booth.umbrellaStartNumber}번~${booth.umbrellaEndNumber}번 우산만 사용할 수 있습니다.` },
                    { status: 400 }
                );
            }
        }

        const { data: umbrella } = await supabase
            .from('Umbrella')
            .select('*')
            .eq('umbrellaNumber', umbrellaNumber)
            .single();

        if (!umbrella) {
            return NextResponse.json(
                { error: '등록되지 않은 우산 번호입니다.' },
                { status: 404 }
            );
        }

        if (umbrella.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: '현재 대여할 수 없는 상태의 우산입니다.' },
                { status: 400 }
            );
        }

        // 2. Create rental record
        const { data: rental, error } = await supabase
            .from('Rental')
            .insert([
                {
                    id: crypto.randomUUID(),
                    umbrellaId,
                    phone,
                    boothId,
                    status: 'RENTED',
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // 3. Update Umbrella status to RENTED and assign to booth
        await supabase
            .from('Umbrella')
            .update({
                status: 'RENTED',
                currentBoothId: boothId,
                updatedAt: new Date().toISOString()
            })
            .eq('id', umbrella.id);

        // Run notion sync in background
        addRentalRecordToNotion({
            umbrellaId,
            phone,
            boothName: booth.name,
            rentedAt: new Date(rental.rentedAt),
        }).catch(console.error);

        return NextResponse.json({ success: true, rental });
    } catch (error) {
        console.error('Rent API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
