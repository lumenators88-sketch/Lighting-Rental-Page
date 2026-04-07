'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Thermometer, Grid3X3, Users, AlertTriangle, X, Upload } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';

type FormField = {
    id: string;
    boothId: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'multi_select' | 'image' | 'date' | 'number' | 'rating' | 'privacy' | 'nationality';
    options: string[] | null;
    required: boolean;
    fieldOrder: number;
};

export default function RentForm({
    boothId,
    boothName,
    boothPhotoUrl,
    formFields = [],
}: {
    boothId: string;
    boothName: string;
    boothPhotoUrl: string;
    formFields?: FormField[];
}) {
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [safetyAgreed, setSafetyAgreed] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [umbrellaId, setUmbrellaId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [customData, setCustomData] = useState<Record<string, any>>({});
    const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});


    useEffect(() => {
        setCustomData(prev => {
            const next = { ...prev };
            let changed = false;
            formFields.forEach(f => {
                if (f.type === 'nationality' && next[f.id] === undefined) {
                    next[f.id] = 'South Korea (대한민국)';
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [formFields]);

    const updateCustomField = (fieldId: string, value: any) => {
        setCustomData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleCustomImageUpload = async (fieldId: string, file: File) => {
        setUploadingFields(prev => ({ ...prev, [fieldId]: true }));
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64 }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                updateCustomField(fieldId, data.url);
                toast.success('사진이 업로드되었습니다.');
                setUploadingFields(prev => ({ ...prev, [fieldId]: false }));
            };
            reader.readAsDataURL(file);
        } catch {
            toast.error('사진 업로드에 실패했습니다.');
            setUploadingFields(prev => ({ ...prev, [fieldId]: false }));
        }
    };

    const toggleMultiSelect = (fieldId: string, option: string) => {
        setCustomData(prev => {
            const current: string[] = prev[fieldId] || [];
            const updated = current.includes(option)
                ? current.filter((o: string) => o !== option)
                : [...current, option];
            return { ...prev, [fieldId]: updated };
        });
    };



    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        const hasCustomPrivacy = formFields.some(f => f.type === 'privacy');
        if (!hasCustomPrivacy && !privacyAgreed) {
            toast.error('개인정보 수집 및 이용에 동의해주세요.');
            return;
        }
        if (!safetyAgreed) {
            toast.error('안전수칙사항 확인에 동의해주세요.');
            return;
        }
        if (phoneInput.trim().length < 5) {
            toast.error('올바른 연락처를 입력해주세요.');
            return;
        }
        if (!umbrellaId) {
            toast.error('우산 QR 코드를 스캔해주세요.');
            return;
        }

        // 커스텀 필드 필수 검증
        for (const field of formFields) {
            if (field.required) {
                const val = customData[field.id];
                if (field.type === 'privacy' && !val) {
                    toast.error(`"${field.label}" 항목에 동의해주세요.`);
                    return;
                }
                if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
                    toast.error(`"${field.label}" 항목을 입력해주세요.`);
                    return;
                }
            }
        }

        // customData를 label 기반으로 변환 (저장용)
        const labeledCustomData: Record<string, any> = {};
        let nationality: string | undefined;
        for (const field of formFields) {
            if (customData[field.id] !== undefined && customData[field.id] !== '') {
                labeledCustomData[field.label] = customData[field.id];
            }
            if (field.type === 'nationality') {
                nationality = customData[field.id] || 'South Korea (대한민국)';
            }
        }

        const phone = phoneInput.trim();

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/rent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    umbrellaId,
                    phone,
                    boothId,
                    nationality,
                    customData: Object.keys(labeledCustomData).length > 0 ? labeledCustomData : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || '대여 처리에 실패했습니다.');
                setIsSubmitting(false);
                return;
            }

            // 성공 시 지정된 외부 URL로 즉시 이동 (해당 페이지에 완료 안내문 포함됨)
            window.location.href = 'https://url.kr/ywvfkc';
        } catch (error) {
            toast.error('네트워크 오류가 발생했습니다.');
            setIsSubmitting(false);
        }
    };


    return (
        <div className="w-full max-w-md mx-auto bg-white min-h-screen relative shadow-2xl pb-safe">
            {/* Event Header - 행사명 + 이미지 */}
            <div className="relative w-full h-[750px] overflow-hidden">
                <img
                    src={boothPhotoUrl}
                    alt={boothName}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white/80 text-sm font-medium mb-1">별빛 우산 대여</p>
                    <h1 className="text-white text-2xl font-extrabold">{boothName}</h1>
                </div>
            </div>

            {/* Safety Guidelines */}
            <div className="px-6 py-12 space-y-14">
                <div className="space-y-4 text-center">
                    <h2 className="text-[22px] font-extrabold text-[#111] leading-[1.3] break-keep">
                        안전한 체험을 위해<br />
                        아래 안전수칙을 숙지하고<br />
                        연락처를 입력해주세요!
                    </h2>
                    <p className="text-[12px] font-bold text-[#111] mt-3 leading-[1.4] break-keep">
                        For a safe experience,<br />
                        please read and agree to the safety guidelines below,<br />
                        then enter your contact information.
                    </p>
                </div>

                <div className="space-y-12">
                    {/* Rule 1 */}
                    <div className="flex flex-col items-center text-center">
                        <Thermometer className="w-12 h-12 text-[#5400d3] mb-4" strokeWidth={2.5} />
                        <div className="bg-[#5400d3] text-white p-5 w-full rounded-xl font-bold text-[15px] leading-relaxed break-keep">
                            손잡이(배터리)부분에 열감이 느껴지거나 연기 또는 타는 냄새가 나면 즉시 전원을 <span className="underline highlight-white">끄고</span> 부스에 반납하세요!
                        </div>
                        <p className="text-[#5400d3] text-[12px] font-bold mt-4 leading-tight">
                            If the handle (battery) becomes hot, immediately turn off<br />the power and return it to the booth.
                        </p>
                    </div>

                    {/* Rule 2 */}
                    <div className="flex flex-col items-center text-center">
                        <Grid3X3 className="w-12 h-12 text-[#5400d3] mb-4" strokeWidth={2.5} />
                        <div className="bg-[#5400d3] text-white p-5 w-full rounded-xl font-bold text-[15px] leading-relaxed break-keep">
                            체험부스 주변에서만 사용해주세요! <span className="text-xs font-normal opacity-90 block mt-1">(반경 200m 이내)</span>
                            <div className="text-[11px] font-normal opacity-90 mt-2 tracking-tight">(실내출입금지, 장소를 이탈하여 발생되는 사고는 본인이 부담합니다.)</div>
                        </div>
                        <p className="text-[#5400d3] text-[12px] font-bold mt-4 leading-tight tracking-tight">
                            For your safety, use the device only in the designated area.<br />
                            Accidents caused by entering restricted areas or<br />
                            leaving designated zones are the individual's responsibility.
                        </p>
                    </div>

                    {/* Rule 3 */}
                    <div className="flex flex-col items-center text-center">
                        <Users className="w-12 h-12 text-[#5400d3] mb-4" strokeWidth={2.5} />
                        <div className="bg-[#5400d3] text-white p-5 w-full rounded-xl font-bold text-[15px] leading-relaxed break-keep">
                            13세 미만 어린이는 보호자 동반 및 감독 하에<br />체험 가능하며 해당 안전수칙을 지도해주세요!
                        </div>
                        <p className="text-[#5400d3] text-[12px] font-bold mt-4 leading-tight">
                            Children under the age of 13 must be accompanied and<br />supervised by a guardian.
                        </p>
                    </div>

                    {/* Rule 4 */}
                    <div className="flex flex-col items-center text-center">
                        <AlertTriangle className="w-12 h-12 text-[#5400d3] mb-4" strokeWidth={2.5} />
                        <div className="bg-[#5400d3] text-white p-5 w-full rounded-xl font-bold text-[15px] leading-relaxed break-keep tracking-tight">
                            차량통행이 많은 곳, 인파가 밀집된 곳은 피해주세요.<br />
                            촬영 목적 외 우산 사용 금지합니다.<br />
                            <span className="text-[11px] font-normal opacity-90 mt-2 block">(우산을 들고 뛰는 행위, 우산을 파손하는 행위 등)</span>
                        </div>
                        <p className="text-[#5400d3] text-[12px] font-bold mt-4 leading-tight tracking-tight">
                            Use of the umbrella is restricted<br />to filming purposes only.<br />(Do not run with the umbrella or damage it.)
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="bg-[#FDF3F8] px-6 py-12 space-y-10">
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Custom Fields (Exclude Privacy) */}
                    {formFields.filter(f => f.type !== 'privacy').length > 0 && (
                        <div className="space-y-6">
                            {formFields.filter(f => f.type !== 'privacy').map((field) => (
                                <div key={field.id} className="space-y-3">
                                    <label className="flex flex-col gap-0.5">
                                        <span className="flex items-center gap-1.5 text-[16px] font-bold text-gray-800">
                                            {field.label}
                                            {field.required && <span className="text-[#ff5252] text-[10px]">●</span>}
                                        </span>
                                        {field.type === 'nationality' && <span className="text-[13px] text-gray-500">Nationality</span>}
                                        {(field.type === 'text' || field.type === 'textarea' || field.type === 'number') && (
                                            <span className="text-[13px] text-gray-500">Please fill in your {field.label === '이름' || field.label === '성함' ? 'name' : field.label === '이메일' ? 'email' : field.label === '소속' ? 'organization' : field.label === '직업' ? 'occupation' : 'answer'}</span>
                                        )}
                                        {field.type === 'select' && <span className="text-[13px] text-gray-500">Please select an option</span>}
                                        {field.type === 'multi_select' && <span className="text-[13px] text-gray-500">Please select all that apply</span>}
                                        {field.type === 'rating' && <span className="text-[13px] text-gray-500">Please rate</span>}
                                        {field.type === 'date' && <span className="text-[13px] text-gray-500">Please select a date</span>}
                                        {field.type === 'image' && <span className="text-[13px] text-gray-500">Please upload a photo</span>}
                                    </label>

                                    {field.type === 'text' && (
                                        <input
                                            type="text"
                                            placeholder={`${field.label} / Please enter`}
                                            value={customData[field.id] || ''}
                                            onChange={(e) => updateCustomField(field.id, e.target.value)}
                                            className="w-full py-4 px-5 rounded-[16px] bg-white border border-gray-100 focus:border-[#5400d3] focus:ring-4 focus:ring-[#5400d3]/10 shadow-sm text-[15px] outline-none font-medium text-gray-800 transition-all"
                                        />
                                    )}

                                    {field.type === 'nationality' && (
                                        <div className="relative">
                                            <select
                                                value={customData[field.id] || 'South Korea (대한민국)'}
                                                onChange={(e) => updateCustomField(field.id, e.target.value)}
                                                className="w-full py-4 px-5 pr-10 appearance-none rounded-[16px] bg-white border border-gray-100 focus:border-[#5400d3] focus:ring-4 focus:ring-[#5400d3]/10 shadow-sm text-[15px] outline-none font-medium text-[hsl(264,100%,41%)] transition-all font-bold"
                                            >
                                                {COUNTRIES.map(c => (
                                                    <option key={c.code} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    )}

                                    {field.type === 'textarea' && (
                                        <textarea
                                            placeholder={`${field.label} / Please enter`}
                                            value={customData[field.id] || ''}
                                            onChange={(e) => updateCustomField(field.id, e.target.value)}
                                            rows={4}
                                            className="w-full py-4 px-5 rounded-[16px] bg-white border border-gray-100 focus:border-[#5400d3] focus:ring-4 focus:ring-[#5400d3]/10 shadow-sm text-[15px] outline-none font-medium text-gray-800 resize-none transition-all"
                                        />
                                    )}

                                    {field.type === 'number' && (
                                        <input
                                            type="number"
                                            placeholder={`${field.label} / Please enter`}
                                            value={customData[field.id] || ''}
                                            onChange={(e) => updateCustomField(field.id, e.target.value)}
                                            className="w-full py-4 px-5 rounded-[16px] bg-white border border-gray-100 focus:border-[#5400d3] focus:ring-4 focus:ring-[#5400d3]/10 shadow-sm text-[15px] outline-none font-medium text-gray-800 transition-all"
                                        />
                                    )}

                                    {field.type === 'date' && (
                                        <input
                                            type="date"
                                            value={customData[field.id] || ''}
                                            onChange={(e) => updateCustomField(field.id, e.target.value)}
                                            className="w-full py-4 px-5 rounded-[16px] bg-white border border-gray-100 focus:border-[#5400d3] focus:ring-4 focus:ring-[#5400d3]/10 shadow-sm text-[15px] outline-none font-medium text-gray-800 transition-all"
                                        />
                                    )}

                                    {field.type === 'select' && field.options && (
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            {(field.options as string[]).map((option) => {
                                                const isSelected = customData[field.id] === option;
                                                return (
                                                    <div
                                                        key={option}
                                                        className={`flex items-center justify-center py-3.5 px-4 rounded-[14px] cursor-pointer transition-all duration-200 border-2 select-none ${isSelected
                                                                ? 'border-[#5400d3] bg-[#5400d3]/5 text-[#5400d3] font-bold shadow-sm'
                                                                : 'border-transparent bg-white text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                                                            }`}
                                                        onClick={() => updateCustomField(field.id, option)}
                                                    >
                                                        <span className="text-[15px] text-center w-full truncate leading-tight">{option}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {field.type === 'multi_select' && field.options && (
                                        <div className="flex flex-wrap gap-2.5 mt-2">
                                            {(field.options as string[]).map((option) => {
                                                const selected = (customData[field.id] || []).includes(option);
                                                return (
                                                    <div
                                                        key={option}
                                                        className={`flex items-center gap-2 py-2.5 px-4 rounded-full cursor-pointer transition-all duration-200 border-2 select-none ${selected
                                                                ? 'border-[#5400d3] bg-[#5400d3] text-white font-bold shadow-md shadow-[#5400d3]/20'
                                                                : 'border-transparent bg-white text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                                                            }`}
                                                        onClick={() => toggleMultiSelect(field.id, option)}
                                                    >
                                                        <span className="text-[14px]">{option}</span>
                                                        {selected && <div className="w-1.5 h-1.5 rounded-full bg-[#FFEA00] ml-1" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {field.type === 'rating' && (
                                        <div className="flex items-center gap-1.5 bg-white p-4 rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-fit">
                                            {[1, 2, 3, 4, 5].map((star) => {
                                                const isActive = (customData[field.id] || 0) >= star;
                                                return (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => updateCustomField(field.id, star)}
                                                        className={`text-[32px] leading-none transition-all duration-300 hover:scale-110 active:scale-90 ${isActive
                                                                ? 'text-[#FFEA00] drop-shadow-[0_2px_4px_rgba(255,234,0,0.4)]'
                                                                : 'text-gray-200 hover:text-gray-300'
                                                            }`}
                                                    >
                                                        ★
                                                    </button>
                                                );
                                            })}
                                            {customData[field.id] && (
                                                <div className="ml-3 bg-[#5400d3] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                                    {customData[field.id]}점
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {field.type === 'image' && (
                                        <div className="mt-2">
                                            {customData[field.id] ? (
                                                <div className="relative group rounded-[20px] overflow-hidden shadow-md">
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center gap-3">
                                                        <label className="bg-white/90 text-black px-4 py-2 rounded-full text-sm font-bold cursor-pointer hover:bg-white transition-colors flex items-center gap-2">
                                                            <Upload className="w-4 h-4" />
                                                            다시 선택
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleCustomImageUpload(field.id, file);
                                                                }}
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCustomField(field.id, '')}
                                                            className="bg-red-500/90 text-white w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-500 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <img
                                                        src={customData[field.id]}
                                                        alt={field.label}
                                                        className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-40 bg-white rounded-[20px] border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#5400d3] hover:bg-[#5400d3]/5 transition-all group shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all mb-3">
                                                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#5400d3]" />
                                                    </div>
                                                    <span className="text-[14px] font-bold text-gray-600 group-hover:text-[#5400d3]">
                                                        {uploadingFields[field.id] ? '업로드 중...' : '터치하여 사진 업로드'}
                                                    </span>
                                                    <span className="text-[12px] text-gray-400 mt-1 font-medium">최대 10MB</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingFields[field.id]}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleCustomImageUpload(field.id, file);
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Phone */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-1.5 text-[16px] font-bold text-gray-800">
                            연락처 <span className="text-[#ff5252] text-[10px]">●</span>
                        </label>
                        <p className="text-[13px] text-gray-500 -mt-2">Contact</p>
                        <input
                            type="tel"
                            placeholder="연락처 / Contact number"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            className="w-full py-4 px-5 rounded-[16px] bg-white border border-gray-100 focus:border-[#5400d3] focus:ring-4 focus:ring-[#5400d3]/10 shadow-sm text-[15px] outline-none font-medium text-gray-800 transition-all"
                        />
                    </div>

                    {/* Privacy (Custom or Default) */}
                    {formFields.filter(f => f.type === 'privacy').length > 0 ? (
                        formFields.filter(f => f.type === 'privacy').map((field) => (
                            <div key={field.id} className="space-y-4">
                                <label className="flex items-center gap-1.5 text-[16px] font-bold text-gray-800">
                                    {field.label} {field.required && <span className="text-[#ff5252] text-[10px]">●</span>}
                                </label>
                                <div className="bg-white p-5 rounded-[16px] h-40 overflow-y-auto text-sm text-gray-700 leading-relaxed shadow-sm border border-gray-100/50 whitespace-pre-wrap">
                                    {field.options?.[0]}
                                </div>
                                <div className="flex items-center gap-3 pt-2 pl-1 cursor-pointer" onClick={() => updateCustomField(field.id, !customData[field.id])}>
                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${customData[field.id] ? 'border-[#FFEA00] bg-[#FFEA00] shadow-sm' : 'border-gray-400 bg-white'}`}>
                                        {customData[field.id] && <span className="text-black text-sm font-bold">✓</span>}
                                    </div>
                                    <label className="text-[15px] font-medium text-gray-800 cursor-pointer select-none">
                                        {field.options?.[1] || '개인정보 수집 및 초상권 이용에 동의하시겠습니까?'}<br />
                                        <span className="text-[13px] text-gray-500 font-normal">Do you agree to the collection of personal information and use of portrait rights?</span>
                                    </label>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="space-y-4">
                            <label className="flex items-center gap-1.5 text-[16px] font-bold text-gray-800">
                                개인정보 수집 및 이용 동의 <span className="text-[#ff5252] text-[10px]">●</span>
                            </label>
                            <p className="text-[13px] text-gray-500 -mt-2">Consent to Collection and Use of Personal Information</p>
                            <div className="bg-white p-5 rounded-lg h-40 overflow-y-auto text-sm text-gray-700 leading-relaxed shadow-sm border border-gray-100/50">
                                회사명(이하 '회사'라 한다)는 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리지침을 수립, 공개합니다.<br /><br />
                                <strong>제1조 (개인정보의 처리목적)</strong><br />
                                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                            </div>
                            <div className="flex items-center gap-3 pt-2 pl-1 cursor-pointer" onClick={() => setPrivacyAgreed(!privacyAgreed)}>
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${privacyAgreed ? 'border-[#FFEA00] bg-[#FFEA00] shadow-sm' : 'border-gray-400 bg-white'}`}>
                                    {privacyAgreed && <span className="text-black text-sm font-bold">✓</span>}
                                </div>
                                <label className="text-[15px] font-medium text-gray-800 cursor-pointer select-none">
                                    개인정보 수집 및 초상권 이용에 동의하시겠습니까?<br />
                                    <span className="text-[13px] text-gray-500 font-normal">Do you agree to the collection of personal information and use of portrait rights?</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Safety Agree */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-1.5 text-[16px] font-bold text-gray-800">
                            위의 안전수칙사항을 확인하셨나요? <span className="text-[#ff5252] text-[10px]">●</span>
                        </label>
                        <p className="text-[13px] text-gray-500 -mt-2">Have you reviewed the safety guidelines above?</p>
                        <div className="flex items-center gap-3 pl-1 cursor-pointer" onClick={() => setSafetyAgreed(!safetyAgreed)}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${safetyAgreed ? 'border-[#FFEA00] bg-[#FFEA00]' : 'border-gray-400 bg-white'}`}>
                                {safetyAgreed && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                            </div>
                            <label className="text-[15px] text-gray-800 cursor-pointer select-none">
                                네, 확인했습니다.<br />
                                <span className="text-[13px] text-gray-500 font-normal">Yes, I have confirmed.</span>
                            </label>
                        </div>
                    </div>

                    {/* QR Scanner / Manual Input */}
                    <div className="space-y-4 pb-6">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-[16px] font-bold text-gray-800">
                                우산 번호 입력 <span className="text-[#ff5252] text-[10px]">●</span>
                            </label>
                        </div>
                        <p className="text-[13px] text-gray-500 -mt-2">Umbrella Number</p>

                        {/* Input Area */}
                        <div className="relative">
                            <input
                                type="number"
                                placeholder=" "
                                value={umbrellaId}
                                onChange={(e) => setUmbrellaId(e.target.value)}
                                className="w-full text-center py-5 rounded-[20px] border-2 border-gray-100 focus:border-[#5400d3] focus:ring-4 focus:ring-[#5400d3]/10 shadow-sm text-xl md:text-2xl outline-none font-bold text-[#5400d3] transition-all bg-white peer"
                            />
                            {!umbrellaId && (
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                                    <span className="text-[14px] text-gray-400 font-medium">스태프에게 안내받은 번호를 입력해주세요.</span>
                                    <span className="text-[13px] text-gray-500">Enter the number provided by staff.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-center pb-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#FFEA00] text-gray-900 font-bold text-lg py-4 px-8 rounded-xl shadow-md w-64 whitespace-nowrap transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            {isSubmitting ? '처리중... / Processing...' : '완료 / Submit'}
                        </button>
                    </div>
                </form>
            </div>




        </div>
    );
}
