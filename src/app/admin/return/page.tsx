'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, X, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

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
    const [mode, setMode] = useState<'input' | 'qr'>('qr');
    const [isScanning, setIsScanning] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    // Keep focus on the input field for USB scanner (only in input mode)
    useEffect(() => {
        if (mode !== 'input') return;
        const focusInterval = setInterval(() => {
            if (document.activeElement !== inputRef.current && !isProcessing) {
                inputRef.current?.focus();
            }
        }, 1000);
        return () => clearInterval(focusInterval);
    }, [isProcessing, mode]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    const extractUmbrellaId = (value: string): string => {
        try {
            const url = new URL(value);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 2 && pathParts[0] === 'rent') {
                return pathParts[1];
            }
        } catch {
            // Not a URL, return as-is
        }
        return value;
    };

    const handleReturn = async (id?: string) => {
        const targetId = id || umbrellaId.trim();
        if (!targetId) return;

        setIsProcessing(true);
        setLastReturned(null);

        try {
            const res = await fetch('/api/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ umbrellaId: targetId }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || '반납 처리에 실패했습니다.');
            } else {
                toast.success(`반납 완료: ${targetId}`);
                setLastReturned(data.rental);
            }
        } catch (err) {
            toast.error('네트워크 오류가 발생했습니다.');
        } finally {
            setUmbrellaId('');
            setIsProcessing(false);
            if (mode === 'input') {
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleReturn();
    };

    const startScanner = async () => {
        setIsScanning(true);
        try {
            const scanner = new Html5Qrcode('qr-reader-return');
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    const id = extractUmbrellaId(decodedText);
                    stopScanner();
                    toast.info(`우산 번호 인식: ${id}`);
                    handleReturn(id);
                },
                () => {}
            );
        } catch (err) {
            toast.error('카메라를 사용할 수 없습니다. 카메라 권한을 확인해주세요.');
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch {}
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const switchMode = (newMode: 'input' | 'qr') => {
        if (isScanning) stopScanner();
        setMode(newMode);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">우산 반납 처리</h2>
                <p className="text-gray-500">
                    QR 코드를 스캔하거나 우산 번호를 직접 입력하세요.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2">
                <Button
                    variant={mode === 'qr' ? 'default' : 'outline'}
                    onClick={() => switchMode('qr')}
                    size="sm"
                >
                    <Camera className="w-4 h-4 mr-2" />
                    QR 스캔
                </Button>
                <Button
                    variant={mode === 'input' ? 'default' : 'outline'}
                    onClick={() => switchMode('input')}
                    size="sm"
                >
                    <Keyboard className="w-4 h-4 mr-2" />
                    직접 입력
                </Button>
            </div>

            <Card className={lastReturned ? 'border-green-500 bg-green-50 shadow-md' : ''}>
                <CardContent className="pt-6">
                    {mode === 'qr' ? (
                        <div className="space-y-4">
                            <div id="qr-reader-return" className={`w-full rounded-xl overflow-hidden ${isScanning ? '' : 'hidden'}`} />
                            {isScanning ? (
                                <Button
                                    onClick={stopScanner}
                                    variant="outline"
                                    className="w-full py-6 text-lg"
                                >
                                    <X className="w-5 h-5 mr-2" />
                                    스캔 중지
                                </Button>
                            ) : (
                                <Button
                                    onClick={startScanner}
                                    className="w-full py-6 text-lg"
                                    disabled={isProcessing}
                                >
                                    <Camera className="w-5 h-5 mr-2" />
                                    {isProcessing ? '처리 중...' : 'QR 스캔 시작'}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex gap-4">
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
                    )}
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
