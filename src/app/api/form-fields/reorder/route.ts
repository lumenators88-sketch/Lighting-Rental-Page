import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT: 다중 폼 필드 순서 변경
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { orderedIds } = body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return NextResponse.json(
                { error: 'orderedIds 배열이 필요합니다.' },
                { status: 400 }
            );
        }

        // Supabase에는 upsert를 사용하여 일괄 업데이트를 할 수 있습니다. (id와 fieldOrder만 포함)
        // 하지만 Supabase JS 클라이언트에서 다중 업데이트를 안전하게 하려면 각 행을 업데이트하거나 upsert를 사용합니다.

        const updates = orderedIds.map((id, index) => ({
            id,
            fieldOrder: index,
        }));

        // upsert는 기본키 기반으로 동작하므로 id만 있으면 기존 row의 나머지 컬럼은 유지되지 않고 덮어씌워질 위험이 있습니다.
        // table 정의에 따라 다를 수 있지만, 제일 안전한 방법은 루프를 돌며 업데이트하거나 RPC를 사용하는 것입니다.
        // Next.js 환경이므로 병렬 Promise.all 로 처리합니다.

        await Promise.all(
            orderedIds.map((id, index) =>
                supabase
                    .from('FormField')
                    .update({ fieldOrder: index })
                    .eq('id', id)
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('FormField reorder error:', error);
        return NextResponse.json(
            { error: '폼 필드 순서 변경 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
