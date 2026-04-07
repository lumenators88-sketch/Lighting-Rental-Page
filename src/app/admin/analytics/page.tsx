'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';

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
    isActive: boolean;
};

export default function AnalyticsPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooth, setSelectedBooth] = useState<'ALL' | string>('ALL');
    const [selectedDate, setSelectedDate] = useState<'ALL' | string>('ALL');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rentalsRes, boothsRes] = await Promise.all([
                fetch('/api/rentals'),
                fetch('/api/booths'),
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
    }, []);

    const toLocalDateKey = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const formatDateLabel = (key: string) => {
        const [y, m, d] = key.split('-');
        return `${y}. ${Number(m)}. ${Number(d)}.`;
    };

    // 선택된 행사 기준 필터
    const filteredRentals = useMemo(() =>
        selectedBooth === 'ALL' ? rentals : rentals.filter(r => r.boothId === selectedBooth),
        [rentals, selectedBooth]
    );

    // 날짜 목록 추출
    const availableDates = useMemo(() => {
        const dateSet = new Set<string>();
        filteredRentals.forEach(r => {
            dateSet.add(toLocalDateKey(r.rentedAt));
        });
        return Array.from(dateSet).sort();
    }, [filteredRentals]);

    // 날짜 기준 필터
    const dateFilteredRentals = useMemo(() =>
        selectedDate === 'ALL' ? filteredRentals : filteredRentals.filter(r =>
            toLocalDateKey(r.rentedAt) === selectedDate
        ),
        [filteredRentals, selectedDate]
    );

    // 기본 통계 (전체 기간, 날짜 필터 적용)
    const totalRentals = dateFilteredRentals.length;
    const currentlyRented = dateFilteredRentals.filter(r => r.status === 'RENTED').length;
    const totalReturned = dateFilteredRentals.filter(r => r.status === 'RETURNED').length;
    const returnRate = totalRentals > 0 ? Math.round((totalReturned / totalRentals) * 100) : 0;

    // 시간대 분석
    const hourlyData = useMemo(() => {
        const counts: Record<number, number> = {};
        for (let i = 0; i < 24; i++) counts[i] = 0;
        dateFilteredRentals.forEach(r => {
            const hour = new Date(r.rentedAt).getHours();
            counts[hour]++;
        });
        return Object.entries(counts)
            .filter(([hour, count]) => Number(hour) >= 8 && Number(hour) <= 22 && count > 0)
            .map(([hour, count]) => ({ time: `${hour}시`, 대여: count }));
    }, [dateFilteredRentals]);

    // 반납 분석
    const returnedRentals = dateFilteredRentals.filter(r => r.status === 'RETURNED' && r.returnedAt);
    const avgReturnMinutes = useMemo(() => {
        if (returnedRentals.length === 0) return 0;
        const total = returnedRentals.reduce((sum, r) => {
            const diff = new Date(r.returnedAt!).getTime() - new Date(r.rentedAt).getTime();
            return sum + diff;
        }, 0);
        return Math.round(total / returnedRentals.length / 1000 / 60);
    }, [returnedRentals]);

    const unreturned = dateFilteredRentals.filter(r => r.status === 'RENTED');

    const formatDuration = (minutes: number) =>
        minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">분석</h2>
                <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    새로고침
                </Button>
            </div>

            {/* 행사 필터 */}
            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant={selectedBooth === 'ALL' ? 'default' : 'outline'}
                    onClick={() => setSelectedBooth('ALL')}
                >
                    전체
                </Button>
                {booths.map(booth => (
                    <Button
                        key={booth.id}
                        size="sm"
                        variant={selectedBooth === booth.id ? 'default' : 'outline'}
                        onClick={() => setSelectedBooth(booth.id)}
                    >
                        {booth.name}
                    </Button>
                ))}
            </div>

            {/* 날짜 필터 */}
            {availableDates.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-500 mr-1">날짜:</span>
                    <Button
                        size="sm"
                        variant={selectedDate === 'ALL' ? 'default' : 'outline'}
                        onClick={() => setSelectedDate('ALL')}
                    >
                        전체 기간
                    </Button>
                    {availableDates.map(date => (
                        <Button
                            key={date}
                            size="sm"
                            variant={selectedDate === date ? 'default' : 'outline'}
                            onClick={() => setSelectedDate(date)}
                        >
                            {formatDateLabel(date)}
                        </Button>
                    ))}
                </div>
            )}

            {/* 기본 통계 */}
            <div>
                <h3 className="text-lg font-bold mb-3">기본 통계</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-gray-500 mb-1">총 대여</p>
                            <p className="text-3xl font-extrabold text-blue-600">{totalRentals}<span className="text-base font-medium text-gray-500 ml-1">건</span></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-gray-500 mb-1">현재 대여 중</p>
                            <p className="text-3xl font-extrabold text-red-500">{currentlyRented}<span className="text-base font-medium text-gray-500 ml-1">건</span></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-gray-500 mb-1">반납 완료</p>
                            <p className="text-3xl font-extrabold text-green-600">{totalReturned}<span className="text-base font-medium text-gray-500 ml-1">건</span></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-gray-500 mb-1">반납률</p>
                            <p className="text-3xl font-extrabold text-purple-600">{returnRate}<span className="text-base font-medium text-gray-500 ml-1">%</span></p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 시간대 분석 */}
            <div>
                <h3 className="text-lg font-bold mb-3">시간대별 대여량 <span className="text-sm font-normal text-gray-500">({selectedDate === 'ALL' ? '전체 기간' : formatDateLabel(selectedDate)})</span> <span className="text-xs text-red-400">[필터:{dateFilteredRentals.length}건 차트:{hourlyData.length}개]</span></h3>
                <Card>
                    <CardContent className="pt-6">
                        {hourlyData.length === 0 ? (
                            <p className="text-center text-gray-400 py-10">대여 데이터가 없습니다.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(hourlyData.length * 40, 160)}>
                                <BarChart data={hourlyData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <YAxis type="category" dataKey="time" tick={{ fontSize: 13 }} width={40} />
                                    <Tooltip />
                                    <Bar dataKey="대여" fill="#5400d3" radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="대여" position="right" style={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} formatter={(v: unknown) => (typeof v === 'number' && v > 0) ? v : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 반납 분석 */}
            <div>
                <h3 className="text-lg font-bold mb-3">반납 분석</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-gray-500 mb-1">평균 대여 시간</p>
                            <p className="text-3xl font-extrabold text-orange-500">
                                {returnedRentals.length === 0 ? '-' : formatDuration(avgReturnMinutes)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <p className="text-sm text-gray-500 mb-1">미반납 우산</p>
                            <p className="text-3xl font-extrabold text-red-500">{unreturned.length}<span className="text-base font-medium text-gray-500 ml-1">개</span></p>
                        </CardContent>
                    </Card>
                </div>

                {unreturned.length > 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">미반납 우산 목록</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {unreturned.map(r => {
                                    const elapsed = Math.round((Date.now() - new Date(r.rentedAt).getTime()) / 1000 / 60);
                                    return (
                                        <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-bold text-[#5400d3]">#{r.umbrellaId}</span>
                                                <span className="text-sm text-gray-500">{r.phone}</span>
                                                {selectedBooth === 'ALL' && (
                                                    <span className="text-xs text-gray-400">{r.booth?.name}</span>
                                                )}
                                            </div>
                                            <span className={`text-sm font-medium ${elapsed > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                                                {formatDuration(elapsed)} 경과
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
