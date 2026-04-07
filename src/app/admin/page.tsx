'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/countries';

type Rental = {
    id: string;
    umbrellaId: string;
    phone: string;
    rentedAt: string;
    returnedAt: string | null;
    status: 'RENTED' | 'RETURNED';
    boothId: string;
    booth: { name: string };
    customData?: Record<string, string>;
};

const nameToCountry = Object.fromEntries(COUNTRIES.map(c => [c.name, c]));

const getFlagEmoji = (code: string) => {
    if (!code || code === 'OTHER') return '🌐';
    return String.fromCodePoint(...code.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};

const getNationality = (customData?: Record<string, string>) => {
    if (!customData) return null;
    const val = Object.values(customData).find(v => nameToCountry[v]);
    if (!val) return null;
    const country = nameToCountry[val];
    const flag = getFlagEmoji(country.code);
    const match = val.match(/\(([^)]+)\)/);
    const label = match ? match[1] : val;
    return { flag, label, dial: country.dial };
};

type Booth = {
    id: string;
    name: string;
    isActive: boolean;
    umbrellaStartNumber: number | null;
    umbrellaEndNumber: number | null;
};

export default function AdminDashboard() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'RENTED' | 'RETURNED'>('ALL');
    const [boothFilter, setBoothFilter] = useState<'ALL' | string>('ALL');
    const [showStats, setShowStats] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ umbrellaId: string, phone: string, status: 'RENTED' | 'RETURNED' } | null>(null);

    const fetchData = async () => {
        if (editingId) return; // don't refresh while editing
        setLoading(true);
        try {
            const [rentalsRes, boothsRes] = await Promise.all([
                fetch('/api/rentals'),
                fetch('/api/booths')
            ]);

            const rentalsData = await rentalsRes.json();
            const boothsData = await boothsRes.json();

            setRentals(rentalsData.rentals || []);
            setBooths(boothsData.booths || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, [editingId]);

    const handleEdit = (rental: Rental) => {
        setEditingId(rental.id);
        setEditForm({ umbrellaId: rental.umbrellaId, phone: rental.phone, status: rental.status });
    };

    const handleSave = async (id: string) => {
        if (!editForm) return;

        try {
            const res = await fetch(`/api/rentals/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('수정되었습니다.');
                setEditingId(null);
                setEditForm(null);
                fetchData();
            } else {
                toast.error(data.error || '수정 실패');
            }
        } catch (error) {
            toast.error('오류가 발생했습니다.');
        }
    };

    // Filter booths to ONLY active booths with an umbrella assignment
    const activeBooths = useMemo(() => {
        return booths.filter(b => b.isActive && b.umbrellaStartNumber !== null && b.umbrellaEndNumber !== null);
    }, [booths]);

    const activeBoothIds = useMemo(() => activeBooths.map(b => b.id), [activeBooths]);

    const filtered = rentals.filter((r) => {
        const isStatusMatch = filter === 'ALL' ? true : r.status === filter;
        const isBoothMatch = boothFilter === 'ALL' ? true : r.boothId === boothFilter;
        // Only show rentals if they belong to an active, assigned booth
        const isActiveBoothMatch = activeBoothIds.includes(r.boothId);

        return isStatusMatch && isBoothMatch && isActiveBoothMatch;
    });

    // Calculate booth summaries
    const boothSummaries = useMemo(() => {
        return activeBooths.map(booth => {
            const boothRentals = rentals.filter(r => r.boothId === booth.id);
            const rentedCount = boothRentals.filter(r => r.status === 'RENTED').length;
            const returnedCount = boothRentals.filter(r => r.status === 'RETURNED').length;

            return {
                ...booth,
                rentedCount,
                returnedCount,
            };
        });
    }, [activeBooths, rentals]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">대여 현황 대시보드</h2>
                <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </Button>
            </div>

            {/* Booth Summaries */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <Card
                    className={`cursor-pointer transition-all ${boothFilter === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    onClick={() => setBoothFilter('ALL')}
                >
                    <CardContent className="p-3 flex items-center justify-center h-full">
                        <h3 className={`font-bold text-sm sm:text-base ${boothFilter === 'ALL' ? 'text-blue-700' : 'text-slate-600'}`}>
                            전체 지역 보기
                        </h3>
                    </CardContent>
                </Card>
                {boothSummaries.map(booth => (
                    <Card
                        key={booth.id}
                        className={`cursor-pointer transition-all ${boothFilter === booth.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                        onClick={() => setBoothFilter(booth.id)}
                    >
                        <CardContent className="p-3">
                            <h3 className={`font-bold text-sm sm:text-base mb-2 ${boothFilter === booth.id ? 'text-blue-800' : 'text-slate-800'}`}>{booth.name}</h3>
                            <div className="flex flex-wrap gap-1 md:gap-2 text-[10px] md:text-xs">
                                <Badge variant="outline" className={`px-1.5 py-0 ${boothFilter === booth.id ? 'bg-white' : 'bg-blue-50'} text-blue-700 border-blue-200`}>
                                    배정 {booth.umbrellaStartNumber ? `${booth.umbrellaStartNumber}~${booth.umbrellaEndNumber}` : '없음'}
                                </Badge>
                                <Badge variant="outline" className={`px-1.5 py-0 ${boothFilter === booth.id ? 'bg-white' : 'bg-red-50'} text-red-700 border-red-200`}>
                                    대여 {booth.rentedCount}
                                </Badge>
                                <Badge variant="outline" className={`px-1.5 py-0 ${boothFilter === booth.id ? 'bg-white' : 'bg-green-50'} text-green-700 border-green-200`}>
                                    반납 {booth.returnedCount}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {boothSummaries.length === 0 && !loading && (
                    <div className="col-span-full p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed text-sm">
                        등록된 행사(부스)가 없습니다.
                    </div>
                )}
            </div>


            <div className="flex gap-2">
                <Button
                    variant={filter === 'ALL' ? 'default' : 'outline'}
                    onClick={() => setFilter('ALL')}
                    size="sm"
                >
                    전체
                </Button>
                <Button
                    variant={filter === 'RENTED' ? 'default' : 'outline'}
                    onClick={() => setFilter('RENTED')}
                    size="sm"
                >
                    대여 중
                </Button>
                <Button
                    variant={filter === 'RETURNED' ? 'default' : 'outline'}
                    onClick={() => setFilter('RETURNED')}
                    size="sm"
                >
                    반납 완료
                </Button>
                <Button
                    variant={showStats ? 'default' : 'outline'}
                    onClick={() => setShowStats(v => !v)}
                    size="sm"
                >
                    통계
                </Button>
            </div>

            {showStats ? (() => {
                const base = boothFilter === 'ALL'
                    ? rentals.filter(r => activeBoothIds.includes(r.boothId))
                    : rentals.filter(r => r.boothId === boothFilter);
                const total = base.length;
                const rented = base.filter(r => r.status === 'RENTED').length;
                const returned = base.filter(r => r.status === 'RETURNED').length;
                const rate = total > 0 ? Math.round((returned / total) * 100) : 0;
                return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">총 대여</p><p className="text-2xl font-extrabold text-blue-600">{total}<span className="text-sm font-medium text-gray-500 ml-1">건</span></p></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">현재 대여 중</p><p className="text-2xl font-extrabold text-red-500">{rented}<span className="text-sm font-medium text-gray-500 ml-1">건</span></p></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">반납 완료</p><p className="text-2xl font-extrabold text-green-600">{returned}<span className="text-sm font-medium text-gray-500 ml-1">건</span></p></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">반납률</p><p className="text-2xl font-extrabold text-purple-600">{rate}<span className="text-sm font-medium text-gray-500 ml-1">%</span></p></CardContent></Card>
                    </div>
                );
            })() : (
            <Card>
                <CardHeader>
                    <CardTitle>최근 기록</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>상태</TableHead>
                                <TableHead>우산 번호</TableHead>
                                <TableHead>국적</TableHead>
                                <TableHead>전화번호</TableHead>
                                <TableHead>대여 행사</TableHead>
                                <TableHead>대여 시각</TableHead>
                                <TableHead>반납 시각</TableHead>
                                <TableHead className="w-[100px] text-center">관리</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((r) => {
                                const isEditing = editingId === r.id;
                                return (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            {isEditing ? (
                                                <select
                                                    className="border rounded px-2 py-1 text-sm bg-white"
                                                    value={editForm?.status}
                                                    onChange={e => setEditForm(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                                                >
                                                    <option value="RENTED">대여중</option>
                                                    <option value="RETURNED">반납완료</option>
                                                </select>
                                            ) : (
                                                <Badge variant={r.status === 'RENTED' ? 'destructive' : 'secondary'}>
                                                    {r.status === 'RENTED' ? '대여중' : '반납완료'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="w-16 border rounded px-2 py-1 text-sm"
                                                    value={editForm?.umbrellaId || ''}
                                                    onChange={e => setEditForm(prev => prev ? { ...prev, umbrellaId: e.target.value } : null)}
                                                />
                                            ) : r.umbrellaId}
                                        </TableCell>
                                        <TableCell>
                                            {(() => {
                                                const nat = getNationality(r.customData);
                                                return nat ? (
                                                    <span className="flex items-center gap-1 text-sm">
                                                        <span>{nat.flag}</span>
                                                        <span>{nat.label}</span>
                                                        {nat.dial && <span className="text-gray-600 text-xs font-medium">{nat.dial}</span>}
                                                    </span>
                                                ) : <span className="text-gray-400 text-sm">-</span>;
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="w-32 border rounded px-2 py-1 text-sm"
                                                    value={editForm?.phone || ''}
                                                    onChange={e => setEditForm(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                                />
                                            ) : r.phone}
                                        </TableCell>
                                        <TableCell>{r.booth?.name || '알 수 없음'}</TableCell>
                                        <TableCell>{new Date(r.rentedAt).toLocaleString('ko-KR')}</TableCell>
                                        <TableCell>
                                            {r.returnedAt ? new Date(r.returnedAt).toLocaleString('ko-KR') : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleSave(r.id)} className="px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs font-bold transition-colors">
                                                        수정완료
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs font-bold transition-colors">
                                                        취소
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleEdit(r)} className="px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 font-bold text-xs transition-colors">
                                                    수정
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        기록이 없습니다.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            )}
        </div>
    );
}
