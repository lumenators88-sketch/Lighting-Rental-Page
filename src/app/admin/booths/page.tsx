'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, Copy, Link } from 'lucide-react';

type Booth = {
    id: string;
    name: string;
    photoUrl: string;
    isActive: boolean;
    umbrellaStartNumber?: number;
    umbrellaEndNumber?: number;
};

export default function BoothsPage() {
    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState<string>(''); // Base64
    const [umbrellaStartNumber, setUmbrellaStartNumber] = useState<number | ''>('');
    const [umbrellaEndNumber, setUmbrellaEndNumber] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // QR Modal State (simple inline)
    const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);

    // Assign Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignBooth, setAssignBooth] = useState<Booth | null>(null);
    const [assignStart, setAssignStart] = useState<number | ''>('');
    const [assignEnd, setAssignEnd] = useState<number | ''>('');
    const [isAssigning, setIsAssigning] = useState(false);

    const fetchBooths = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/booths');
            const data = await res.json();
            setBooths(data.booths || []);
        } catch {
            toast.error('행상 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooths();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !photo) {
            toast.error('이름과 대표 사진을 입력해주세요.');
            return;
        }
        if (umbrellaStartNumber === '' || umbrellaEndNumber === '') {
            toast.error('우산 시작 번호와 끝 번호를 입력해주세요.');
            return;
        }
        if (Number(umbrellaStartNumber) > Number(umbrellaEndNumber)) {
            toast.error('끝 번호가 시작 번호보다 커야 합니다.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload photo
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: photo }),
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadData.error);

            // 2. Create booth
            const res = await fetch('/api/booths', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    photoUrl: uploadData.url,
                    umbrellaStartNumber: Number(umbrellaStartNumber),
                    umbrellaEndNumber: Number(umbrellaEndNumber)
                }),
            });

            if (!res.ok) throw new Error('행상 생성 실패');

            toast.success('새 행상이 등록되었습니다.');
            setName('');
            setPhoto('');
            setUmbrellaStartNumber('');
            setUmbrellaEndNumber('');
            fetchBooths();
        } catch (err: any) {
            toast.error(err.message || '오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/booths/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !current }),
            });
            if (res.ok) fetchBooths();
        } catch {
            toast.error('상태 변경에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`'${name}' 행상을 정말 삭제하시겠습니까?\n(관련된 모든 정보가 삭제될 수 있습니다)`)) return;

        try {
            const res = await fetch(`/api/booths/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('삭제 실패');

            toast.success('행상이 삭제되었습니다.');
            fetchBooths();
        } catch (err: any) {
            toast.error(err.message || '삭제 중 오류가 발생했습니다.');
        }
    };

    const handleComplete = async (id: string, name: string) => {
        if (!confirm(`'${name}' 행사를 완료 처리하시겠습니까?\n\n우산 배정이 해제되고 행사가 비활성화됩니다.`)) return;

        try {
            const res = await fetch(`/api/booths/${id}/complete`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error('행사 완료 처리 실패');

            toast.success('행사가 완료 처리되었습니다.');
            fetchBooths();
        } catch (err: any) {
            toast.error(err.message || '행사 완료 처리 중 오류가 발생했습니다.');
        }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignBooth) return;

        if (assignStart === '' || assignEnd === '') {
            toast.error('우산 시작 번호와 끝 번호를 입력해주세요.');
            return;
        }
        if (Number(assignStart) > Number(assignEnd)) {
            toast.error('끝 번호가 시작 번호보다 커야 합니다.');
            return;
        }

        setIsAssigning(true);
        try {
            const res = await fetch(`/api/booths/${assignBooth.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    umbrellaStartNumber: Number(assignStart),
                    umbrellaEndNumber: Number(assignEnd)
                }),
            });

            if (!res.ok) throw new Error('배정 실패');

            toast.success('우산 배정이 업데이트 되었습니다.');
            setAssignModalOpen(false);
            setAssignBooth(null);
            fetchBooths();
        } catch (err: any) {
            toast.error(err.message || '업데이트 중 오류가 발생했습니다.');
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">행상 관리</h2>
                <p className="text-gray-500">행상을 등록하고 QR 코드를 발급받으세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>새 행상 추가</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>행상 이름</Label>
                                <Input
                                    placeholder="예: 강남역 부스"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>우산 시작 번호</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="예: 1"
                                        value={umbrellaStartNumber}
                                        onChange={e => setUmbrellaStartNumber(e.target.value ? Number(e.target.value) : '')}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>우산 끝 번호</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="예: 50"
                                        value={umbrellaEndNumber}
                                        onChange={e => setUmbrellaEndNumber(e.target.value ? Number(e.target.value) : '')}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>대표 사진 장소</Label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                />
                                {photo && (
                                    <div className="mt-2 text-sm text-green-600 font-medium">사진 첨부 완료</div>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? '등록 중...' : '행상 추가'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Booth List */}
                <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {booths.map((booth) => (
                            <Card key={booth.id} className={!booth.isActive ? 'opacity-60' : ''}>
                                <div className="h-[500px] bg-gray-100 relative">
                                    <img
                                        src={booth.photoUrl}
                                        alt={booth.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex items-center gap-2">
                                        <div className="bg-white rounded-md p-1 px-2 shadow flex items-center gap-2">
                                            <span className="text-xs font-semibold">{booth.isActive ? '운영중' : '숨김처리'}</span>
                                            <Switch
                                                checked={booth.isActive}
                                                onCheckedChange={() => toggleActive(booth.id, booth.isActive)}
                                            />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 text-xs opacity-90 hover:opacity-100 bg-white/80 hover:bg-white text-gray-800"
                                            onClick={() => {
                                                setAssignBooth(booth);
                                                setAssignStart(booth.umbrellaStartNumber || '');
                                                setAssignEnd(booth.umbrellaEndNumber || '');
                                                setAssignModalOpen(true);
                                            }}
                                        >
                                            우산 배정
                                        </Button>
                                        {booth.umbrellaStartNumber && booth.umbrellaEndNumber && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 text-xs opacity-90 hover:opacity-100 bg-green-500/90 hover:bg-green-600 text-white"
                                                onClick={() => handleComplete(booth.id, booth.name)}
                                            >
                                                행사 완료
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-8 text-xs opacity-90 hover:opacity-100"
                                            onClick={() => handleDelete(booth.id, booth.name)}
                                        >
                                            삭제
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg">{booth.name}</h3>
                                            <p className="text-xs text-mono text-gray-500">ID: {booth.id.split('-')[0]}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setSelectedBooth(booth)}>
                                            우산 QR
                                        </Button>
                                    </div>
                                    {booth.umbrellaStartNumber && booth.umbrellaEndNumber ? (
                                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                            <p className="text-xs font-semibold text-blue-700 mb-1">우산 배정 내역</p>
                                            <p className="text-sm font-bold text-blue-900">
                                                {booth.umbrellaStartNumber}번 ~ {booth.umbrellaEndNumber}번
                                                <span className="ml-2 text-xs font-medium text-blue-600">
                                                    (총 {booth.umbrellaEndNumber - booth.umbrellaStartNumber + 1}개)
                                                </span>
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200">
                                            <p className="text-xs text-gray-400">우산 배정 없음</p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                        <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <p className="text-xs text-gray-500 truncate flex-1 font-mono">
                                            /rent/booth?booth={booth.id.split('-')[0]}...
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2"
                                            onClick={() => {
                                                const url = `${window.location.origin}/rent/booth?booth=${booth.id}`;
                                                navigator.clipboard.writeText(url);
                                                toast.success('대여 폼 URL이 복사되었습니다!');
                                            }}
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2"
                                            onClick={() => {
                                                const url = `${window.location.origin}/rent/booth?booth=${booth.id}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {loading && <p className="text-gray-500">불러오는 중...</p>}
                        {!loading && booths.length === 0 && (
                            <p className="text-gray-500 col-span-2 text-center py-8">등록된 행상이 없습니다.</p>
                        )}
                    </div>

                    {/* QR Generator Area */}
                    {selectedBooth && (
                        <Card className="border-blue-200 mt-8">
                            <CardHeader className="bg-blue-50">
                                <CardTitle className="text-blue-800">
                                    {selectedBooth.name} - 우산 대여 QR 코드 생성기
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <p className="text-sm text-gray-600">
                                    우산 번호를 입력하면, 해당 번호가 담긴 QR 코드가 생성됩니다.<br />
                                    고객이 대여 폼에서 이 QR을 스캔하면 우산 번호가 자동 입력됩니다.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-8 items-start">
                                    <div className="flex-1 space-y-4 min-w-0">
                                        <Label>우산 번호 (바코드 하단 숫자 입력)</Label>
                                        <Input id="manual-umb-id" placeholder="UB-10023" />
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                const el = document.getElementById('manual-umb-id') as HTMLInputElement;
                                                if (el.value) {
                                                    setSelectedBooth({ ...selectedBooth, tempUmbId: el.value } as any);
                                                }
                                            }}
                                        >
                                            QR 생성
                                        </Button>
                                    </div>

                                    <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-white border rounded-lg shadow-sm">
                                        {/* @ts-ignore */}
                                        {selectedBooth.tempUmbId ? (
                                            <>
                                                <QRCodeSVG
                                                    // @ts-ignore
                                                    value={selectedBooth.tempUmbId}
                                                    size={150}
                                                />
                                                <p className="mt-4 text-sm font-mono font-bold">
                                                    {/* @ts-ignore */}
                                                    {selectedBooth.tempUmbId}
                                                </p>
                                            </>
                                        ) : (
                                            <div className="w-[150px] h-[150px] bg-gray-50 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed">
                                                우산 번호 대기중
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* Assign Modal Overlay */}
                    {assignModalOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-sm">
                                <CardHeader>
                                    <CardTitle>우산 배정 수정</CardTitle>
                                    <p className="text-sm text-gray-500">{assignBooth?.name}</p>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAssignSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>시작 번호</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={assignStart}
                                                    onChange={e => setAssignStart(e.target.value ? Number(e.target.value) : '')}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>끝 번호</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={assignEnd}
                                                    onChange={e => setAssignEnd(e.target.value ? Number(e.target.value) : '')}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setAssignModalOpen(false)}
                                            >
                                                취소
                                            </Button>
                                            <Button type="submit" disabled={isAssigning}>
                                                {isAssigning ? '저장 중...' : '확인'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
