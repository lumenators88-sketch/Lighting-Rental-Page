import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 부스별 폼 필드 목록 조회
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const boothId = searchParams.get('boothId');

        if (!boothId) {
            return NextResponse.json(
                { error: 'boothId가 필요합니다.' },
                { status: 400 }
            );
        }

        const { data: fields, error } = await supabase
            .from('FormField')
            .select('*')
            .eq('boothId', boothId)
            .order('fieldOrder', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ fields: fields || [] });
    } catch (error) {
        console.error('FormField GET error:', error);
        return NextResponse.json(
            { error: '폼 필드 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// POST: 폼 필드 추가
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { boothId, label, type, options, required, fieldOrder } = body;

        if (!boothId || !label || !type) {
            return NextResponse.json(
                { error: 'boothId, label, type은 필수입니다.' },
                { status: 400 }
            );
        }

        const validTypes = ['text', 'textarea', 'select', 'multi_select', 'image', 'date', 'number', 'rating', 'privacy', 'nationality'];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `유효하지 않은 타입입니다. (${validTypes.join(', ')})` },
                { status: 400 }
            );
        }

        // fieldOrder 자동 계산: 미지정 시 기존 최대값 + 1
        let order = fieldOrder;
        if (order === undefined || order === null) {
            const { data: maxField } = await supabase
                .from('FormField')
                .select('fieldOrder')
                .eq('boothId', boothId)
                .order('fieldOrder', { ascending: false })
                .limit(1)
                .single();

            order = maxField ? maxField.fieldOrder + 1 : 0;
        }

        const { data: field, error } = await supabase
            .from('FormField')
            .insert({
                boothId,
                label,
                type,
                options: options || null,
                required: required || false,
                fieldOrder: order,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, field });
    } catch (error) {
        console.error('FormField POST error:', error);
        return NextResponse.json(
            { error: '폼 필드 추가 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
