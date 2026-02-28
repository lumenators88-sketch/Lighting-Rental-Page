import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PATCH: 폼 필드 수정
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { label, type, options, required, fieldOrder } = body;

        const updates: Record<string, unknown> = {};
        if (label !== undefined) updates.label = label;
        if (type !== undefined) updates.type = type;
        if (options !== undefined) updates.options = options;
        if (required !== undefined) updates.required = required;
        if (fieldOrder !== undefined) updates.fieldOrder = fieldOrder;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: '수정할 항목이 없습니다.' },
                { status: 400 }
            );
        }

        const { data: field, error } = await supabase
            .from('FormField')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, field });
    } catch (error) {
        console.error('FormField PATCH error:', error);
        return NextResponse.json(
            { error: '폼 필드 수정 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE: 폼 필드 삭제
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabase
            .from('FormField')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('FormField DELETE error:', error);
        return NextResponse.json(
            { error: '폼 필드 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
