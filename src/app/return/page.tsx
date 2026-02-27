'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Umbrella, Headset, MessageCircle, Instagram, Facebook, Youtube, RotateCcw } from 'lucide-react';

type RentalItem = {
    id: string;
    umbrellaId: string;
    phone: string;
    rentedAt: string;
    booth: { name: string };
};

export default function SelfReturnPage() {
    const [phone1, setPhone1] = useState('010');
    const [phone2, setPhone2] = useState('');
    const [phone3, setPhone3] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [rentals, setRentals] = useState<RentalItem[]>([]);
    const [searched, setSearched] = useState(false);
    const [returnedRental, setReturnedRental] = useState<RentalItem | null>(null);
    const router = useRouter();

    const phone = `${phone1}-${phone2}-${phone3}`;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (phone2.length < 3 || phone3.length < 4) {
            toast.error('올바른 휴대전화 번호를 입력해주세요.');
            return;
        }

        setIsSearching(true);
        setSearched(false);
        setRentals([]);
        setReturnedRental(null);

        try {
            const res = await fetch(`/api/return-self?phone=${encodeURIComponent(phone)}`);
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || '조회에 실패했습니다.');
                setIsSearching(false);
                return;
            }

            setRentals(data.rentals);
            setSearched(true);

            if (data.rentals.length === 0) {
                toast.error('해당 번호로 대여 중인 우산이 없습니다.');
            }
        } catch {
            toast.error('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleReturn = async (rental: RentalItem) => {
        setIsReturning(true);

        try {
            const res = await fetch('/api/return-self', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rentalId: rental.id, phone }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || '반납 처리에 실패했습니다.');
                setIsReturning(false);
                return;
            }

            setReturnedRental(rental);
            setRentals((prev) => prev.filter((r) => r.id !== rental.id));
            toast.success('반납이 완료되었습니다!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            toast.error('네트워크 오류가 발생했습니다.');
        } finally {
            setIsReturning(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 반납 완료 화면
    if (returnedRental && rentals.length === 0) {
        return (
            <div className="w-full max-w-md mx-auto bg-white min-h-screen relative shadow-2xl flex flex-col items-center justify-center p-8 space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">☂️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">반납이 완료되었습니다!</h2>
                <p className="text-gray-500 text-center">이용해 주셔서 감사합니다.</p>
                <div className="w-full bg-gray-50 p-6 rounded-xl space-y-4 border border-gray-100">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">대여 장소</p>
                        <p className="font-bold text-lg text-gray-900">{returnedRental.booth.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">우산 번호</p>
                        <p className="font-mono font-bold text-xl text-blue-600">{returnedRental.umbrellaId}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">대여 시각</p>
                        <p className="font-medium text-gray-700">{formatDate(returnedRental.rentedAt)}</p>
                    </div>
                </div>
                <button
                    className="w-full h-14 text-lg mt-8 rounded-xl bg-[#5400d3] text-white font-bold hover:bg-[#4500b0] transition-colors"
                    onClick={() => router.push('/')}
                >
                    처음으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white min-h-screen relative shadow-2xl pb-safe">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#5400d3] to-[#7c3aed] px-6 py-12 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RotateCcw className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold mb-2">스스로 반납하기</h1>
                <p className="text-white/80 text-sm">
                    대여 시 입력한 전화번호를 입력하시면<br />
                    바로 반납 처리됩니다.
                </p>
            </div>

            {/* Form Section */}
            <div className="px-6 py-10 space-y-8">
                <form onSubmit={handleSearch} className="space-y-6">
                    {/* Phone Input */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-1.5 text-[16px] font-bold text-gray-800">
                            연락처 입력 <span className="text-[#ff5252] text-[10px]">●</span>
                        </label>
                        <p className="text-sm text-gray-500">대여할 때 입력한 전화번호를 입력해주세요.</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="tel"
                                maxLength={3}
                                value={phone1}
                                onChange={(e) => setPhone1(e.target.value.replace(/\D/g, ''))}
                                className="w-full text-center py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5400d3] shadow-sm text-lg outline-none font-medium text-gray-800"
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input
                                type="tel"
                                maxLength={4}
                                value={phone2}
                                onChange={(e) => setPhone2(e.target.value.replace(/\D/g, ''))}
                                className="w-full text-center py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5400d3] shadow-sm text-lg outline-none font-medium text-gray-800"
                                placeholder="0000"
                                autoFocus
                            />
                            <span className="text-gray-300 font-bold">-</span>
                            <input
                                type="tel"
                                maxLength={4}
                                value={phone3}
                                onChange={(e) => setPhone3(e.target.value.replace(/\D/g, ''))}
                                className="w-full text-center py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5400d3] shadow-sm text-lg outline-none font-medium text-gray-800"
                                placeholder="0000"
                            />
                        </div>
                    </div>

                    {/* Search Button */}
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="w-full bg-[#5400d3] text-white font-bold text-lg py-4 rounded-xl shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {isSearching ? '조회 중...' : '대여 내역 조회'}
                    </button>
                </form>

                {/* No Results */}
                {searched && rentals.length === 0 && !returnedRental && (
                    <div className="text-center py-12 space-y-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                            <Umbrella className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">대여 중인 우산이 없습니다.</p>
                        <p className="text-gray-400 text-sm">전화번호를 다시 확인해주세요.</p>
                    </div>
                )}

                {/* Rental List */}
                {rentals.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-[16px] font-bold text-gray-800">
                            대여 중인 우산 <span className="text-[#5400d3]">{rentals.length}건</span>
                        </h3>
                        {rentals.map((rental) => (
                            <div
                                key={rental.id}
                                className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">우산 번호</p>
                                        <p className="font-mono font-bold text-xl text-[#5400d3]">
                                            {rental.umbrellaId}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">대여 장소</p>
                                        <p className="font-bold text-gray-800">{rental.booth.name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">대여 시각</p>
                                    <p className="text-gray-700">{formatDate(rental.rentedAt)}</p>
                                </div>
                                <button
                                    onClick={() => handleReturn(rental)}
                                    disabled={isReturning}
                                    className="w-full bg-[#FFEA00] text-gray-900 font-bold text-base py-3.5 rounded-xl shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isReturning ? '처리 중...' : '이 우산 반납하기'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 추가 반납 완료 메시지 (여러 건 중 일부 반납 시) */}
                {returnedRental && rentals.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                            <p className="font-bold text-green-800">
                                우산 {returnedRental.umbrellaId}번 반납 완료!
                            </p>
                            <p className="text-green-600 text-sm">나머지 우산도 반납해주세요.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-black text-[#f5f5f5] px-8 py-12 text-[13px] font-light leading-[1.8] pb-36">
                <div className="space-y-8">
                    <div>
                        <p className="font-semibold text-sm mb-2 text-white tracking-widest">밝히는 사람들</p>
                        <p>사업자등록번호 689-29-01176</p>
                        <p>부산광역시 사하구 두송로 188번길 43 1층</p>
                        <p>통신판매업 신고번호 제2022-부산사하구-0853</p>
                        <p>대표 위.동.영.</p>
                    </div>
                    <div>
                        <p>고객센터 051 255 2080</p>
                        <p>이메일 saramdle88@gmail.com</p>
                        <p>팩스 051 255 2082</p>
                    </div>
                    <div className="pt-4 text-gray-400 border-t border-gray-800">
                        <p className="mb-6">Copyright &copy; 2026 밝히는 사람들 All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="#" className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                                <Youtube className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
                <a href="tel:051-255-2080" className="bg-[#FFE600] text-black w-[90px] h-[72px] rounded-[24px] shadow-2xl flex flex-col items-center justify-center hover:scale-105 transition-transform">
                    <MessageCircle className="w-7 h-7 fill-black mb-1" />
                    <span className="text-[12px] font-black tracking-tight">카톡상담</span>
                </a>
                <a href="tel:051-255-2080" className="bg-gray-500 text-white w-[110px] h-[64px] rounded-[20px] shadow-xl flex flex-col items-center justify-center hover:scale-105 transition-transform absolute right-0 top-[85px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Headset className="w-4 h-4" />
                        <span className="text-[12px] font-bold tracking-tight">상담문의</span>
                    </div>
                    <span className="text-[16px] font-black tracking-tighter">051 255 2080</span>
                </a>
            </div>
        </div>
    );
}
