'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type RentalResponse = {
    id: string;
    umbrellaId: string;
    phone: string;
    rentedAt: string;
    booth: { name: string };
};

export default function AdminReturnPage() {
    const [umbrellaId, setUmbrellaId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastReturned, setLastReturned] = useState<RentalResponse | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep focus on the input field for USB scanner
    useEffect(() => {
        const focusInterval = setInterval(() => {
            if (document.activeElement !== inputRef.current && !isProcessing) {
                inputRef.current?.focus();
            }
        }, 1000);
        return () => clearInterval(focusInterval);
    }, [isProcessing]);

    const handleReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!umbrellaId.trim()) return;

        setIsProcessing(true);
        setLastReturned(null);

        try {
            const res = await fetch('/api/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ umbrellaId: umbrellaId.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || '반납 처리에 실패했습니다.');
            } else {
                toast.success(`반납 완료: ${umbrellaId}`);
                setLastReturned(data.rental);
            }
        } catch (err) {
            toast.error('네트워크 오류가 발생했습니다.');
        } finally {
            setUmbrellaId('');
            setIsProcessing(false);
            // Wait a tick before refocusing
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">우산 반납 처리</h2>
                <p className="text-gray-500">
                    USB 바코드 스캐너로 우산의 바코드를 스캔하세요. (입력창이 항상 활성화됩니다)
                </p>
            </div>

            <Card className={lastReturned ? 'border-green-500 bg-green-50 shadow-md' : ''}>
                <CardContent className="pt-6">
                    <form onSubmit={handleReturn} className="flex gap-4">
                        <Input
                            ref={inputRef}
                            value={umbrellaId}
                            onChange={(e) => setUmbrellaId(e.target.value)}
                            placeholder="바코드 스캔 또는 직접 입력"
                            className="text-lg py-6 font-mono bg-white"
                            autoFocus
                            disabled={isProcessing}
                        />
                        <Button
                            type="submit"
                            className="py-6 px-8 text-lg"
                            disabled={isProcessing || !umbrellaId}
                        >
                            {isProcessing ? '처리중...' : '반납'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {lastReturned && (
                <Card className="border-green-200 bg-white">
                    <CardHeader className="bg-green-50 border-b border-green-100">
                        <CardTitle className="text-green-800 flex items-center gap-2">
                            <span className="text-2xl">✅</span> 정상 반납 처리되었습니다
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">우산 번호</p>
                                <p className="font-mono font-medium text-lg">{lastReturned.umbrellaId}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">대여자 연락처</p>
                                <p className="font-medium text-lg">{lastReturned.phone}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">대여 장소</p>
                                <p className="font-medium text-lg">{lastReturned.booth.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-gray-500">대여 시각</p>
                                <p className="font-medium text-lg">
                                    {new Date(lastReturned.rentedAt).toLocaleString('ko-KR')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
