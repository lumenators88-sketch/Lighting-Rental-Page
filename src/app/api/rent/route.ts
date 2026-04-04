import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { exportSingleSurveyToNotion } from '@/lib/notion';
import { sendRentalNotification } from '@/lib/solapi';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { umbrellaId, phone, boothId, customData } = body;

        if (!umbrellaId || !phone || !boothId) {
            console.log("Rent API 400: Missing required fields", { umbrellaId, phone, boothId });
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
            console.log("Rent API 400: Umbrella already rented", umbrellaId);
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
            console.log("Rent API 404: Booth not found", boothId);
            return NextResponse.json(
                { error: 'Booth not found' },
                { status: 404 }
            );
        }

        // 1. Check if Umbrella exists, is available, and belongs to this booth's range
        const umbrellaNumber = parseInt(umbrellaId, 10);
        if (isNaN(umbrellaNumber)) {
            console.log("Rent API 400: Invalid umbrella format", umbrellaId);
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
                    ...(customData ? { customData } : {}),
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Supabase already returns a valid ISO string (e.g., ...+00:00).
        // Appending 'Z' to it causes "Invalid Date" in JavaScript.

        // 3. Update Umbrella status to RENTED and assign to booth
        await supabase
            .from('Umbrella')
            .update({
                status: 'RENTED',
                currentBoothId: boothId,
                updatedAt: new Date().toISOString()
            })
            .eq('id', umbrella.id);

        // 4. Export customData to Notion at rent time (사전 질문)
        if (customData && Object.keys(customData).length > 0) {
            console.log('[Rent API] Calling exportSingleSurveyToNotion with:', {
                boothName: booth.name,
                rentedAt: rental.rentedAt,
                customDataKeys: Object.keys(customData),
                timestamp: new Date().toISOString()
            });
            exportSingleSurveyToNotion(booth.name, rental.rentedAt, customData, 'RENT').catch(console.error);
        }
        // 5. Send Alim-talk notification (background)
        if (phone) {
            // 휴대폰 번호의 마지막 4자리를 추출하여 이름 변수로 사용 (예: 5678)
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const nameSuffix = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : cleanPhone;
            
            sendRentalNotification(phone, nameSuffix, umbrellaId).catch((err: any) => {
                console.error('[Rent API] Failed to send Alim-talk:', err);
            });
        }

        return NextResponse.json({ success: true, rental });
    } catch (error) {
        console.error('Rent API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
