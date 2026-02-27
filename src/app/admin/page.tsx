'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

type Rental = {
    id: string;
    umbrellaId: string;
    phone: string;
    rentedAt: string;
    returnedAt: string | null;
    status: 'RENTED' | 'RETURNED';
    boothId: string;
    booth: { name: string };
};

type Booth = {
    id: string;
    name: string;
    umbrellaStartNumber: number | null;
    umbrellaEndNumber: number | null;
};

export default function AdminDashboard() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'RENTED' | 'RETURNED'>('ALL');

    const fetchData = async () => {
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
    }, []);

    const filtered = rentals.filter((r) => {
        if (filter === 'ALL') return true;
        return r.status === filter;
    });

    // Calculate booth summaries
    const boothSummaries = useMemo(() => {
        return booths.map(booth => {
            const boothRentals = rentals.filter(r => r.boothId === booth.id);
            const rentedCount = boothRentals.filter(r => r.status === 'RENTED').length;
            const returnedCount = boothRentals.filter(r => r.status === 'RETURNED').length;

            return {
                ...booth,
                rentedCount,
                returnedCount,
            };
        });
    }, [booths, rentals]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {boothSummaries.map(booth => (
                    <Card key={booth.id} className="bg-slate-50 border-slate-200">
                        <CardContent className="p-4">
                            <h3 className="font-bold text-lg mb-2 text-slate-800">{booth.name}</h3>
                            <div className="flex flex-wrap gap-2 text-sm font-medium">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    배정 {booth.umbrellaStartNumber ? `${booth.umbrellaStartNumber}~${booth.umbrellaEndNumber}번` : '없음'}
                                    {booth.umbrellaStartNumber && booth.umbrellaEndNumber ? ` (총 ${booth.umbrellaEndNumber - booth.umbrellaStartNumber + 1}개)` : ''}
                                </Badge>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    대여 중 {booth.rentedCount}개
                                </Badge>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    반납 {booth.returnedCount}개
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {boothSummaries.length === 0 && !loading && (
                    <div className="col-span-full p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        등록된 행상(부스)이 없습니다.
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-4">
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
            </div>

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
                                <TableHead>전화번호</TableHead>
                                <TableHead>대여 행상</TableHead>
                                <TableHead>대여 시각</TableHead>
                                <TableHead>반납 시각</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        <Badge variant={r.status === 'RENTED' ? 'destructive' : 'secondary'}>
                                            {r.status === 'RENTED' ? '대여중' : '반납완료'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono">{r.umbrellaId}</TableCell>
                                    <TableCell>{r.phone}</TableCell>
                                    <TableCell>{r.booth?.name || '알 수 없음'}</TableCell>
                                    <TableCell>{new Date(r.rentedAt).toLocaleString('ko-KR')}</TableCell>
                                    <TableCell>
                                        {r.returnedAt ? new Date(r.returnedAt).toLocaleString('ko-KR') : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        기록이 없습니다.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
