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

type UmbrellaLoss = {
    id: string;
    umbrellaId: string;
    boothId: string | null;
    boothName: string | null;
    status: 'LOST' | 'RECOVERED';
    lostAt: string;
    recoveredAt: string | null;
};

export default function AdminDashboard() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [booths, setBooths] = useState<Booth[]>([]);
    const [losses, setLosses] = useState<UmbrellaLoss[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'RENTED' | 'RETURNED'>('ALL');
    const [boothFilter, setBoothFilter] = useState<'ALL' | string>('ALL');
    const [showStats, setShowStats] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ umbrellaId: string, phone: string, status: 'RENTED' | 'RETURNED' } | null>(null);

    const fetchData = async () => {
        if (editingId) return;
        setLoading(true);
        try {
            const [rentalsRes, boothsRes, lossesRes] = await Promise.all([
                fetch('/api/rentals'),
                fetch('/api/booths'),
                fetch('/api/umbrellas/losses'),
            ]);

            const rentalsData = await rentalsRes.json();
            const boothsData = await boothsRes.json();
            const lossesData = await lossesRes.json();

            setRentals(rentalsData.rentals || []);
            setBooths(boothsData.booths || []);
            setLosses(lossesData.losses || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLoss = async (rental: Rental) => {
        if (!confirm(`#${rental.umbrellaId} 우산을 로스 처리하시겠습니까?`)) return;
        try {
            const res = await fetch('/api/umbrellas/loss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ umbrellaId: rental.umbrellaId, boothId: rental.boothId, boothName: rental.booth?.name }),
            });
            if (res.ok) {
                toast.success(`#${rental.umbrellaId} 로스 처리되었습니다.`);
                fetchData();
            } else {
                toast.error('로스 처리 실패');
            }
        } catch {
            toast.error('오류가 발생했습니다.');
        }
    };

    const handleRecover = async (loss: UmbrellaLoss) => {
        if (!confirm(`#${loss.umbrellaId} 우산을 복구 처리하시겠습니까?`)) return;
        try {
            const res = await fetch(`/api/umbrellas/loss/${loss.id}/recover`, { method: 'PATCH' });
            if (res.ok) {
                toast.success(`#${loss.umbrellaId} 복구 처리되었습니다.`);
                fetchData();
            } else {
                toast.error('복구 처리 실패');
            }
        } catch {
            toast.error('오류가 발생했습니다.');
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

    const handleDailyComplete = async () => {
        if (!confirm('오늘 행사를 완료하시겠습니까?\n대여 기록이 백업되고 현황이 초기화됩니다.\n(부스 설정은 유지되어 내일 바로 시작 가능합니다)')) return;
        try {
            const targetBooths = booths.filter(b => b.isActive);
            if (targetBooths.length === 0) {
                toast.error('활성화된 부스가 없습니다.');
                return;
            }
            await Promise.all(
                targetBooths.map(b => fetch(`/api/booths/${b.id}/daily-complete`, { method: 'POST' }))
            );
            toast.success('오늘 행사가 완료되었습니다. 내일 바로 시작하실 수 있습니다.');
            fetchData();
        } catch {
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
                <div className="flex gap-2">
                    <Button onClick={handleDailyComplete} variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                        오늘 행사 완료
                    </Button>
                    <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        새로고침
                    </Button>
                </div>
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
                    onClick={() => {
                        setFilter('ALL');
                        setShowStats(false);
                    }}
                    size="sm"
                >
                    전체
                </Button>
                <Button
                    variant={filter === 'RENTED' ? 'default' : 'outline'}
                    onClick={() => {
                        setFilter('RENTED');
                        setShowStats(false);
                    }}
                    size="sm"
                >
                    대여 중
                </Button>
                <Button
                    variant={filter === 'RETURNED' ? 'default' : 'outline'}
                    onClick={() => {
                        setFilter('RETURNED');
                        setShowStats(false);
                    }}
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
                const returnedWithTime = base.filter(r => r.status === 'RETURNED' && r.returnedAt);
                const avgMinutes = returnedWithTime.length > 0
                    ? Math.round(returnedWithTime.reduce((sum, r) => sum + (new Date(r.returnedAt!).getTime() - new Date(r.rentedAt).getTime()), 0) / returnedWithTime.length / 1000 / 60)
                    : null;
                const avgLabel = avgMinutes === null ? '-' : avgMinutes >= 60 ? `${Math.floor(avgMinutes / 60)}시간 ${avgMinutes % 60}분` : `${avgMinutes}분`;
                return (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">총 대여</p><p className="text-2xl font-extrabold text-blue-600">{total}<span className="text-sm font-medium text-gray-500 ml-1">건</span></p></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">현재 대여 중</p><p className="text-2xl font-extrabold text-red-500">{rented}<span className="text-sm font-medium text-gray-500 ml-1">건</span></p></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">반납 완료</p><p className="text-2xl font-extrabold text-green-600">{returned}<span className="text-sm font-medium text-gray-500 ml-1">건</span></p></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">반납률</p><p className="text-2xl font-extrabold text-purple-600">{rate}<span className="text-sm font-medium text-gray-500 ml-1">%</span></p></CardContent></Card>
                        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 mb-1">평균 대여 시간</p><p className="text-2xl font-extrabold text-orange-500">{avgLabel}</p></CardContent></Card>
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
                                <TableHead>경과 시간</TableHead>
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
                                        <TableCell>
                                            {(() => {
                                                const end = r.returnedAt ? new Date(r.returnedAt) : new Date();
                                                const mins = Math.round((end.getTime() - new Date(r.rentedAt).getTime()) / 1000 / 60);
                                                const label = mins >= 60 ? `${Math.floor(mins / 60)}시간 ${mins % 60}분` : `${mins}분`;
                                                return (
                                                    <span className={`text-sm font-medium ${r.status === 'RENTED' && mins > 30 ? 'text-red-500' : 'text-gray-500'}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
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
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleEdit(r)} className="px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 font-bold text-xs transition-colors">
                                                        수정
                                                    </button>
                                                    {r.status === 'RENTED' && (
                                                        <button onClick={() => handleLoss(r)} className="px-2 py-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 font-bold text-xs transition-colors">
                                                            로스
                                                        </button>
                                                    )}
                                                </div>
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

            {/* 로스 현황 */}
            {(() => {
                const activeLosses = losses.filter(l => l.status === 'LOST');
                return (
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold">로스 현황</h3>
                            <span className="text-sm font-semibold text-orange-500">{activeLosses.length}개</span>
                        </div>
                        {activeLosses.length === 0 ? (
                            <p className="text-sm text-gray-400">로스된 우산이 없습니다.</p>
                        ) : (
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>우산 번호</TableHead>
                                                <TableHead>행사</TableHead>
                                                <TableHead>로스 시각</TableHead>
                                                <TableHead className="text-center">복구</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeLosses.map(l => (
                                                <TableRow key={l.id}>
                                                    <TableCell className="font-mono font-bold text-orange-500">#{l.umbrellaId}</TableCell>
                                                    <TableCell>{l.boothName || '-'}</TableCell>
                                                    <TableCell>{new Date(l.lostAt).toLocaleString('ko-KR')}</TableCell>
                                                    <TableCell className="text-center">
                                                        <button onClick={() => handleRecover(l)} className="px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 font-bold text-xs transition-colors">
                                                            복구
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}
