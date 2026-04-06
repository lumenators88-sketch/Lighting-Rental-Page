'use client';

import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, RotateCcw, Plus, List } from 'lucide-react';

function BarcodeLabel({ value }: { value: string }) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, value, {
                format: 'CODE128',
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 36,
                fontOptions: 'bold',
                margin: 4,
            });
        }
    }, [value]);

    return (
        <div
            className="label-item print:border-black flex flex-col items-center justify-center bg-white border border-gray-200"
            style={{
                width: '50mm',
                height: '25mm',
                padding: '1mm',
                boxSizing: 'border-box',
                pageBreakInside: 'avoid',
            }}
        >
            <svg ref={svgRef} />
        </div>
    );
}

export default function BarcodeGeneratorPage() {
    const [id, setId] = useState('');
    const [startNum, setStartNum] = useState('');
    const [endNum, setEndNum] = useState('');
    const [barcodeList, setBarcodeList] = useState<string[]>([]);

    const handleSingleGenerate = () => {
        if (!id) return;
        setBarcodeList([id]);
    };

    const handleBulkGenerate = () => {
        const start = parseInt(startNum);
        const end = parseInt(endNum);
        if (isNaN(start) || isNaN(end) || start > end) return;

        const list = [];
        for (let i = start; i <= end; i++) {
            list.push(String(i));
        }
        setBarcodeList(list);
    };

    const handleReset = () => {
        setId('');
        setStartNum('');
        setEndNum('');
        setBarcodeList([]);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="print:hidden space-y-2">
                <h1 className="text-3xl font-extrabold text-gray-900">바코드 생성기</h1>
                <p className="text-gray-500 text-sm">우산에 붙일 바코드 라벨을 생성하고 인쇄할 수 있습니다.</p>
            </div>

            {/* Controls */}
            <div className="print:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Single */}
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

                {/* Bulk */}
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

            {/* Actions */}
            <div className="print:hidden flex justify-between items-center">
                <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> 초기화
                </Button>
                <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-8">
                    <Printer className="w-5 h-5" /> 라벨 인쇄하기
                </Button>
            </div>

            {/* Preview */}
            <div className="bg-white p-4 md:p-8 rounded-2xl shadow-inner border border-gray-100 min-h-[400px]">
                {barcodeList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 print:hidden">
                        <p>생성된 바코드가 없습니다. 정보를 입력하고 생성 버튼을 눌러주세요.</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {barcodeList.map((val) => (
                            <BarcodeLabel key={val} value={val} />
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 0; background: white; }
                    aside, header, nav, button, .print\\:hidden { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .label-item { float: left; margin: 0.5mm; }
                }
            `}</style>
        </div>
    );
}
