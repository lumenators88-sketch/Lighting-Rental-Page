'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function QuickReturnPage() {
    const { umbrellaId } = useParams<{ umbrellaId: string }>();
    const router = useRouter();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const confirmed = window.confirm(`우산 ${umbrellaId}번을 반납 처리하시겠습니까?`);
        if (!confirmed) {
            setStatus('error');
            setErrorMessage('반납이 취소되었습니다.');
            return;
        }

        const processReturn = async () => {
            try {
                const res = await fetch('/api/return', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ umbrellaId }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setErrorMessage(data.error || '반납 처리에 실패했습니다.');
                    setStatus('error');
                } else {
                    setStatus('success');
                }
            } catch {
                setErrorMessage('네트워크 오류가 발생했습니다.');
                setStatus('error');
            }
        };

        processReturn();
    }, [umbrellaId]);

    if (status === 'processing') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-4">
                <div className="w-12 h-12 border-4 border-[#5400d3] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 font-medium">반납 처리 중...</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6 p-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">☂️</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">반납 완료!</h1>
                <p className="text-gray-500 text-center">우산 {umbrellaId}번이 반납 처리되었습니다.</p>
                <button
                    className="w-full max-w-xs h-14 text-lg rounded-xl bg-[#5400d3] text-white font-bold"
                    onClick={() => router.push('/')}
                >
                    처음으로
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white space-y-6 p-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">반납 실패</h1>
            <p className="text-gray-500 text-center">{errorMessage}</p>
            <button
                className="w-full max-w-xs h-14 text-lg rounded-xl bg-gray-200 text-gray-800 font-bold"
                onClick={() => router.back()}
            >
                돌아가기
            </button>
        </div>
    );
}
