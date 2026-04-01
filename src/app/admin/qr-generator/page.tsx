'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, RotateCcw, Plus, List } from 'lucide-react';

export default function QRGeneratorPage() {
    const [id, setId] = useState('');
    const [startNum, setStartNum] = useState('');
    const [endNum, setEndNum] = useState('');
    const [qrList, setQrList] = useState<string[]>([]);
    const printRef = useRef<HTMLDivElement>(null);

    const handleSingleGenerate = () => {
        if (!id) return;
        setQrList([id]);
    };

    const handleBulkGenerate = () => {
        const start = parseInt(startNum);
        const end = parseInt(endNum);
        if (isNaN(start) || isNaN(end) || start > end) return;
        
        const list = [];
        for (let i = start; i <= end; i++) {
            list.push(String(i));
        }
        setQrList(list);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleReset = () => {
        setId('');
        setStartNum('');
        setEndNum('');
        setQrList([]);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header - Hidden on Print */}
            <div className="print:hidden space-y-2">
                <h1 className="text-3xl font-extrabold text-gray-900">QR 생성기</h1>
                <p className="text-gray-500 text-sm">우산에 부탁할 QR 라벨을 생성하고 인쇄할 수 있습니다. (30x20mm 규격)</p>
            </div>

            {/* Controls - Hidden on Print */}
            <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Single Generation */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Plus className="w-5 h-5" />
                        <h2 className="font-bold">단일 생성</h2>
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="우산 번호 입력 (예: 101)" 
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        />
                        <Button onClick={handleSingleGenerate}>생성</Button>
                    </div>
                </div>

                {/* Bulk Generation */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center gap-2 text-purple-600">
                        <List className="w-5 h-5" />
                        <h2 className="font-bold">대량 생성</h2>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Input 
                            type="number"
                            placeholder="시작 번호" 
                            value={startNum}
                            onChange={(e) => setStartNum(e.target.value)}
                        />
                        <span className="text-gray-400">~</span>
                        <Input 
                            type="number"
                            placeholder="끝 번호" 
                            value={endNum}
                            onChange={(e) => setEndNum(e.target.value)}
                        />
                        <Button onClick={handleBulkGenerate} variant="secondary">생성</Button>
                    </div>
                </div>
            </div>

            {/* Actions - Hidden on Print */}
            <div className="print:hidden flex justify-between items-center">
                <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> 초기화
                </Button>
                <div className="flex gap-3">
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-8">
                        <Printer className="w-5 h-5" /> 라벨 인쇄하기
                    </Button>
                </div>
            </div>

            {/* QR Preview Area - Styled for Print */}
            <div className="bg-white p-4 md:p-8 rounded-2xl shadow-inner border border-gray-100 min-h-[400px]">
                {qrList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 print:hidden">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <QrCode className="w-10 h-10 opacity-30" />
                        </div>
                        <p>생성된 QR 코드가 없습니다. 정보를 입력하고 생성 버튼을 눌러주세요.</p>
                    </div>
                ) : (
                    <div 
                        ref={printRef}
                        className="flex flex-wrap gap-2 justify-center"
                    >
                        {qrList.map((qrId) => (
                            <div 
                                key={qrId}
                                className="label-item print:border-black flex flex-col items-center justify-center bg-white border border-gray-200"
                                style={{
                                    width: '30mm',
                                    height: '20mm',
                                    padding: '1mm',
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pageBreakInside: 'avoid'
                                }}
                            >
                                <div 
                                    className="text-center font-black font-mono leading-none flex items-center justify-center" 
                                    style={{ 
                                        fontSize: qrId.length === 1 || qrId.length === 2 ? '24pt' : '16pt', 
                                        width: '10mm',
                                        height: '7mm',
                                        marginBottom: '0.5mm',
                                        letterSpacing: '-1px'
                                    }}
                                >
                                    {qrId.length === 1 ? `0${qrId}` : qrId}
                                </div>
                                <div className="qr-container flex items-center justify-center" style={{ height: '10mm' }}>
                                    <QRCodeSVG 
                                        value={`${window.location.origin}/rent/${qrId}`} 
                                        size={38} 
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Print Only Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    /* Hide EVERYTHING in the main layout except our print content */
                    aside, header, nav, button, .print\\:hidden {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .flex-wrap {
                        display: block !important;
                    }
                    .label-item {
                        float: left;
                        border: 0.1mm solid #eee !important; /* Very faint line for cutting guide if needed */
                        margin: 0.5mm; /* Small gap to prevent overlap on some printers */
                    }
                }
            `}</style>
        </div>
    );
}

// Icon component since it was missing in the earlier context
function QrCode({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="5" height="5" x="3" y="3" rx="1" />
            <rect width="5" height="5" x="16" y="3" rx="1" />
            <rect width="5" height="5" x="3" y="16" rx="1" />
            <path d="M21 16V21H16" />
            <path d="M21 9V14" />
            <path d="M9 21H14" />
            <path d="M7 7H7.01" />
            <path d="M17 7H17.01" />
            <path d="M7 17H7.01" />
        </svg>
    )
}
