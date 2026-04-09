'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function QuickReturnPage() {
    const { umbrellaId } = useParams<{ umbrellaId: string }>();
    const router = useRouter();
    const [status, setStatus] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
    const [errorMessage, setErrorMessage] = useState('');

    const processReturn = async () => {
        setStatus('processing');
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

    if (status === 'confirm') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f3eeff] to-[#e8f0ff] p-6">
                <div className="bg-white rounded-[32px] shadow-xl w-full max-w-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#5400d3] px-8 pt-10 pb-12 flex flex-col items-center gap-3">
                        <span className="text-5xl">☂️</span>
                        <p className="text-purple-200 text-sm font-medium tracking-widest uppercase">Umbrella Return</p>
                    </div>

                    {/* Body */}
                    <div className="px-8 pb-8 -mt-6">
                        <div className="bg-white rounded-2xl shadow-md px-6 py-5 mb-6 text-center">
                            <p className="text-xs text-gray-400 font-medium mb-1">우산 번호</p>
                            <p className="text-5xl font-black text-[#5400d3] tracking-tight">#{umbrellaId}</p>
                        </div>

                        <p className="text-center text-gray-500 text-sm mb-6 leading-relaxed">
                            해당 우산을 반납 처리합니다.<br />확인 버튼을 눌러주세요.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={processReturn}
                                className="w-full h-14 rounded-2xl bg-[#5400d3] text-white text-lg font-bold shadow-lg shadow-purple-200 active:scale-95 transition-all"
                            >
                                반납 확인
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="w-full h-12 rounded-2xl text-gray-400 text-base font-medium active:scale-95 transition-all"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'processing') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f3eeff] to-[#e8f0ff] gap-4">
                <div className="w-14 h-14 border-4 border-[#5400d3] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#5400d3] font-semibold text-lg">처리 중...</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f3eeff] to-[#e8f0ff] p-6">
                <div className="bg-white rounded-[32px] shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="bg-green-500 px-8 pt-10 pb-12 flex flex-col items-center gap-3">
                        <span className="text-5xl">✅</span>
                        <p className="text-green-100 text-sm font-medium tracking-widest uppercase">Return Complete</p>
                    </div>
                    <div className="px-8 pb-8 -mt-6">
                        <div className="bg-white rounded-2xl shadow-md px-6 py-5 mb-6 text-center">
                            <p className="text-xs text-gray-400 font-medium mb-1">우산 번호</p>
                            <p className="text-5xl font-black text-green-500 tracking-tight">#{umbrellaId}</p>
                        </div>
                        <p className="text-center text-gray-500 text-sm">반납이 완료되었습니다.<br />감사합니다! 🙏</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f3eeff] to-[#e8f0ff] p-6">
            <div className="bg-white rounded-[32px] shadow-xl w-full max-w-sm overflow-hidden">
                <div className="bg-red-500 px-8 pt-10 pb-12 flex flex-col items-center gap-3">
                    <span className="text-5xl">⚠️</span>
                    <p className="text-red-100 text-sm font-medium tracking-widest uppercase">Return Failed</p>
                </div>
                <div className="px-8 pb-8 -mt-6">
                    <div className="bg-white rounded-2xl shadow-md px-6 py-5 mb-6 text-center">
                        <p className="text-gray-600 text-sm font-medium">{errorMessage}</p>
                    </div>
                    <button
                        className="w-full h-14 rounded-2xl bg-gray-100 text-gray-700 text-lg font-bold active:scale-95 transition-all"
                        onClick={() => router.back()}
                    >
                        돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
