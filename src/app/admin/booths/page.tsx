'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, Copy, Link, FileEdit, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Type, AlignLeft, CircleDot, CheckSquare, Image as ImageIcon, Calendar, Hash, Star, X, ShieldCheck, Download, QrCode, Printer } from 'lucide-react';
import { Reorder } from 'framer-motion';

type Booth = {
    id: string;
    name: string;
    photoUrl: string;
    isActive: boolean;
    umbrellaStartNumber?: number;
    umbrellaEndNumber?: number;
};

type FormField = {
    id: string;
    boothId: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'multi_select' | 'image' | 'date' | 'number' | 'rating' | 'privacy';
    options: string[] | null;
    required: boolean;
    fieldOrder: number;
};

const FIELD_TYPE_LABELS: Record<string, string> = {
    text: '짧은 텍스트',
    textarea: '긴 텍스트',
    select: '단일 선택',
    multi_select: '복수 선택',
    image: '사진 업로드',
    date: '날짜',
    number: '숫자',
    rating: '별점 (5점)',
    privacy: '개인정보 동의',
};

const FIELD_TYPES = [
    { id: 'text', label: '단답형', icon: Type },
    { id: 'textarea', label: '장문형', icon: AlignLeft },
    { id: 'select', label: '단일선택', icon: CircleDot },
    { id: 'multi_select', label: '복수선택', icon: CheckSquare },
    { id: 'number', label: '숫자', icon: Hash },
    { id: 'date', label: '날짜', icon: Calendar },
    { id: 'rating', label: '별점', icon: Star },
    { id: 'image', label: '사진', icon: ImageIcon },
    { id: 'privacy', label: '약관동의', icon: ShieldCheck },
];

export default function BoothsPage() {
    const [booths, setBooths] = useState<Booth[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState<string>(''); // Base64
    const [umbrellaStartNumber, setUmbrellaStartNumber] = useState<number | ''>('');
    const [umbrellaEndNumber, setUmbrellaEndNumber] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create Booth - Form Fields State
    const [createFormFields, setCreateFormFields] = useState<Omit<FormField, 'id' | 'boothId' | 'fieldOrder'>[]>([]);
    const [createFieldLabel, setCreateFieldLabel] = useState('');
    const [createFieldType, setCreateFieldType] = useState<FormField['type']>('text');
    const [createFieldRequired, setCreateFieldRequired] = useState(false);
    const [createFieldOptions, setCreateFieldOptions] = useState<string[]>([]);
    const [createOptionInput, setCreateOptionInput] = useState('');
    const [createPrivacyCheckboxText, setCreatePrivacyCheckboxText] = useState('');

    // QR Modal State (simple inline)
    const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
    const [selectedFormBooth, setSelectedFormBooth] = useState<Booth | null>(null);

    // Assign Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignBooth, setAssignBooth] = useState<Booth | null>(null);
    const [assignStart, setAssignStart] = useState<number | ''>('');
    const [assignEnd, setAssignEnd] = useState<number | ''>('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Form Editor Modal State
    const [formEditorOpen, setFormEditorOpen] = useState(false);
    const [formEditorBooth, setFormEditorBooth] = useState<Booth | null>(null);
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [formFieldsLoading, setFormFieldsLoading] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState<FormField['type']>('text');
    const [newFieldRequired, setNewFieldRequired] = useState(false);
    const [newFieldOptions, setNewFieldOptions] = useState<string[]>([]);
    const [optionInput, setOptionInput] = useState('');
    const [privacyCheckboxText, setPrivacyCheckboxText] = useState('');
    const [isAddingField, setIsAddingField] = useState(false);

    const fetchBooths = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/booths');
            const data = await res.json();
            setBooths(data.booths || []);
        } catch {
            toast.error('행사 목록을 불러오지 못했습니다.');
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
                    umbrellaEndNumber: Number(umbrellaEndNumber),
                    formFields: createFormFields
                }),
            });

            if (!res.ok) throw new Error('행사 생성 실패');

            toast.success('새 행사가 등록되었습니다.');
            setName('');
            setPhoto('');
            setUmbrellaStartNumber('');
            setUmbrellaEndNumber('');
            setCreateFormFields([]);
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
        if (!confirm(`'${name}' 행사를 정말 삭제하시겠습니까?\n(관련된 모든 정보가 삭제될 수 있습니다)`)) return;

        try {
            const res = await fetch(`/api/booths/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('삭제 실패');

            toast.success('행사가 삭제되었습니다.');
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

    // Form Editor Handlers
    const openFormEditor = async (booth: Booth) => {
        setFormEditorBooth(booth);
        setFormEditorOpen(true);
        setFormFieldsLoading(true);
        try {
            const res = await fetch(`/api/form-fields?boothId=${booth.id}`);
            const data = await res.json();
            setFormFields(data.fields || []);
        } catch {
            toast.error('폼 필드를 불러오지 못했습니다.');
        } finally {
            setFormFieldsLoading(false);
        }
    };

    const handleReorder = async (newOrder: FormField[]) => {
        // Prevent unnecessary API calls if the order hasn't changed
        const isSameOrder = newOrder.every((field, index) => field.id === formFields[index]?.id);
        if (isSameOrder) return;

        // Optimistically update the UI
        setFormFields(newOrder);

        try {
            const orderedIds = newOrder.map(f => f.id);
            const res = await fetch('/api/form-fields/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            // Optionally, we could show a toast: toast.success('순서가 변경되었습니다.');
        } catch (err: any) {
            toast.error(err.message || '순서 변경 중 오류가 발생했습니다.');
            // Revert on failure by refetching
            if (formEditorBooth) {
                openFormEditor(formEditorBooth);
            }
        }
    };

    const handleAddField = async () => {
        if (!formEditorBooth || !newFieldLabel.trim()) {
            toast.error('필드 이름을 입력해주세요.');
            return;
        }

        const needsOptions = newFieldType === 'select' || newFieldType === 'multi_select';
        const isPrivacy = newFieldType === 'privacy';
        const parsedOptions = isPrivacy 
            ? [optionInput.trim(), privacyCheckboxText.trim() || '개인정보 수집 및 초상권 이용에 동의하시겠습니까?'] 
            : (needsOptions ? newFieldOptions : null);

        if (needsOptions && (!parsedOptions || parsedOptions.length < 2)) {
            toast.error('선택형은 최소 2개 이상의 옵션을 추가해주세요.');
            return;
        }

        if (isPrivacy && (!optionInput.trim())) {
            toast.error('약관 내용을 입력해주세요.');
            return;
        }

        setIsAddingField(true);
        try {
            const res = await fetch('/api/form-fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boothId: formEditorBooth.id,
                    label: newFieldLabel.trim(),
                    type: newFieldType,
                    options: parsedOptions,
                    required: newFieldRequired,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setFormFields(prev => [...prev, data.field]);
            setNewFieldLabel('');
            setNewFieldType('text');
            setNewFieldRequired(false);
            setNewFieldOptions([]);
            setOptionInput('');
            toast.success('필드가 추가되었습니다.');
        } catch (err: any) {
            toast.error(err.message || '필드 추가 실패');
        } finally {
            setIsAddingField(false);
        }
    };

    const handleDeleteField = async (fieldId: string) => {
        if (!confirm('이 필드를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/form-fields/${fieldId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('삭제 실패');
            setFormFields(prev => prev.filter(f => f.id !== fieldId));
            toast.success('필드가 삭제되었습니다.');
        } catch {
            toast.error('필드 삭제 중 오류가 발생했습니다.');
        }
    };

    // Add Field in Create Mode
    const handleAddCreateField = () => {
        if (!createFieldLabel.trim()) {
            toast.error('필드 이름을 입력해주세요.');
            return;
        }

        const needsOptions = createFieldType === 'select' || createFieldType === 'multi_select';
        const isPrivacy = createFieldType === 'privacy';
        const parsedOptions = isPrivacy 
            ? [createOptionInput.trim(), createPrivacyCheckboxText.trim() || '개인정보 수집 및 초상권 이용에 동의하시겠습니까?'] 
            : (needsOptions ? createFieldOptions : null);

        if (needsOptions && (!parsedOptions || parsedOptions.length < 2)) {
            toast.error('선택형은 최소 2개 이상의 옵션을 추가해주세요.');
            return;
        }

        if (isPrivacy && !createOptionInput.trim()) {
            toast.error('약관 내용을 입력해주세요.');
            return;
        }

        const newField = {
            label: createFieldLabel.trim(),
            type: createFieldType,
            options: parsedOptions,
            required: createFieldRequired,
        };

        setCreateFormFields(prev => [...prev, newField]);
        setCreateFieldLabel('');
        setCreateFieldType('text');
        setCreateFieldRequired(false);
        setCreateFieldOptions([]);
        setCreateOptionInput('');
    };

    const handleDeleteCreateField = (index: number) => {
        setCreateFormFields(prev => prev.filter((_, i) => i !== index));
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
                    umbrellaEndNumber: Number(assignEnd),
                    isActive: true // Force reactivation on new assignment
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
                <h2 className="text-2xl font-bold tracking-tight">행사 관리</h2>
                <p className="text-gray-500">행사를 등록하고 QR 코드를 발급받으세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>새 행사 추가</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>행사 이름</Label>
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

                            {/* Create Booth Custom Fields */}
                            <div className="pt-6 border-t space-y-4">
                                <div>
                                    <Label className="text-base font-bold">대여 폼 커스텀 질문 항목 (선택)</Label>
                                    <p className="text-sm text-gray-500 mb-4">행사 등록 시 수집하고 싶은 정보를 추가할 수 있습니다.</p>
                                </div>

                                {/* Added Create Fields List */}
                                <div className="space-y-2">
                                    {createFormFields.map((field, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-50 border rounded-lg p-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{field.label}</span>
                                                    {field.required && (
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">필수</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-400">{FIELD_TYPE_LABELS[field.type]}</span>
                                                    {field.options && (
                                                        <span className="text-xs text-gray-400">
                                                            · {(field.options as string[]).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                                onClick={() => handleDeleteCreateField(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Create Field Editor */}
                                <div className="bg-gray-50 rounded-xl p-4 border space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">필드 타입 선택</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {FIELD_TYPES.map(ft => {
                                                const IconComponent = ft.icon;
                                                const isSelected = createFieldType === ft.id;
                                                return (
                                                    <div
                                                        key={ft.id}
                                                        onClick={() => setCreateFieldType(ft.id as FormField['type'])}
                                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-[hsl(264,100%,41%)] bg-[hsl(264,100%,41%)]/5 text-[hsl(264,100%,41%)]' : 'border-transparent bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900 shadow-sm'}`}
                                                    >
                                                        <IconComponent className="w-4 h-4 mb-1" />
                                                        <span className="text-[10px] font-bold text-center tracking-tight">{ft.label}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">질문 제목</Label>
                                        <Input
                                            placeholder="예: 여행 만족도는 어떠셨나요?"
                                            value={createFieldLabel}
                                            onChange={e => setCreateFieldLabel(e.target.value)}
                                            className="h-10 rounded-xl bg-white focus-visible:ring-[hsl(264,100%,41%)]"
                                        />
                                    </div>

                                    {(createFieldType === 'select' || createFieldType === 'multi_select') && (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold">선택 옵션 추가</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="예: 대만족"
                                                    value={createOptionInput}
                                                    onChange={e => setCreateOptionInput(e.target.value)}
                                                    className="h-10 rounded-xl bg-white focus-visible:ring-[hsl(264,100%,41%)]"
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (createOptionInput.trim() && !createFieldOptions.includes(createOptionInput.trim())) {
                                                                setCreateFieldOptions([...createFieldOptions, createOptionInput.trim()]);
                                                                setCreateOptionInput('');
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="h-10 rounded-xl px-4 hover:bg-[hsl(264,100%,41%)] hover:text-white"
                                                    onClick={() => {
                                                        if (createOptionInput.trim() && !createFieldOptions.includes(createOptionInput.trim())) {
                                                            setCreateFieldOptions([...createFieldOptions, createOptionInput.trim()]);
                                                            setCreateOptionInput('');
                                                        }
                                                    }}
                                                >추가</Button>
                                            </div>
                                            {createFieldOptions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {createFieldOptions.map(opt => (
                                                        <span key={opt} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-[hsl(264,100%,41%)] text-white text-xs font-medium">
                                                            {opt}
                                                            <button type="button" onClick={() => setCreateFieldOptions(createFieldOptions.filter(o => o !== opt))} className="bg-white/20 hover:bg-white/40 rounded-full p-0.5 transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {createFieldType === 'privacy' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">약관 내용 입력</Label>
                                                <textarea
                                                    placeholder="동의받을 약관 전문을 입력해주세요."
                                                    value={createOptionInput}
                                                    onChange={e => setCreateOptionInput(e.target.value)}
                                                    rows={5}
                                                    className="w-full py-3 px-4 rounded-xl bg-white border border-gray-200 focus:border-[hsl(264,100%,41%)] focus:ring-4 focus:ring-[hsl(264,100%,41%)]/10 shadow-sm text-sm outline-none font-medium text-gray-800 resize-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">체크박스 동의 문구 (미입력 시 기본문구 노출)</Label>
                                                <Input
                                                    placeholder="예: 개인정보 수집 및 초상권 이용에 동의하시겠습니까?"
                                                    value={createPrivacyCheckboxText}
                                                    onChange={e => setCreatePrivacyCheckboxText(e.target.value)}
                                                    className="h-10 rounded-xl bg-white focus-visible:ring-[hsl(264,100%,41%)]"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={createFieldRequired}
                                                onCheckedChange={setCreateFieldRequired}
                                            />
                                            <Label className="text-xs text-gray-600">필수 항목</Label>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className={`h-9 px-4 rounded-xl font-bold transition-all ${createFieldLabel.trim()
                                                    ? 'bg-[hsl(264,100%,41%)] text-white hover:bg-[hsl(264,100%,35%)] shadow-md shadow-[hsl(264,100%,41%)]/20 hover:shadow-lg hover:-translate-y-0.5'
                                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                                                }`}
                                            onClick={handleAddCreateField}
                                            disabled={!createFieldLabel.trim()}
                                        >
                                            <Plus className="w-4 h-4 mr-1.5" />
                                            필드 추가하기
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-6" disabled={isSubmitting}>
                                {isSubmitting ? '등록 중...' : '행사 추가'}
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
                                            variant={(!booth.isActive && (!booth.umbrellaStartNumber || !booth.umbrellaEndNumber)) ? "default" : "secondary"}
                                            size="sm"
                                            className={`h-8 text-xs opacity-90 hover:opacity-100 ${(!booth.isActive && (!booth.umbrellaStartNumber || !booth.umbrellaEndNumber)) ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/80 hover:bg-white text-gray-800'}`}
                                            onClick={() => {
                                                setAssignBooth(booth);
                                                setAssignStart(booth.umbrellaStartNumber || '');
                                                setAssignEnd(booth.umbrellaEndNumber || '');
                                                setAssignModalOpen(true);
                                            }}
                                        >
                                            {(!booth.isActive && (!booth.umbrellaStartNumber || !booth.umbrellaEndNumber)) ? '행사 재시작' : '우산 배정'}
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
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openFormEditor(booth)}>
                                                <FileEdit className="w-3.5 h-3.5 mr-1" />
                                                폼 편집
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setSelectedBooth(booth);
                                                setSelectedFormBooth(null);
                                            }}>
                                                우산 QR
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setSelectedFormBooth(booth);
                                                setSelectedBooth(null);
                                            }}>
                                                폼 QR
                                            </Button>
                                        </div>
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
                            <p className="text-gray-500 col-span-2 text-center py-8">등록된 행사가 없습니다.</p>
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

                    {/* Form QR Generator Area */}
                    {selectedFormBooth && (
                        <Card className="border-purple-200 mt-8">
                            <CardHeader className="bg-purple-50">
                                <CardTitle className="text-purple-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="w-5 h-5" />
                                        <span>{selectedFormBooth.name} - 대여 폼 QR 코드</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedFormBooth(null)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <p className="text-sm text-gray-600">
                                    고객들이 대여 폼에 접속할 수 있는 전용 QR 코드입니다.<br />
                                    이 QR 코드를 인쇄하여 부스 전면에 부착해주시면 됩니다.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-8 items-center bg-gray-50/50 p-8 rounded-2xl border border-dashed border-purple-100">
                                    <div className="bg-white p-4 rounded-xl shadow-lg border border-purple-50" id="form-qr-container">
                                        <QRCodeSVG
                                            value={`${window.location.origin}/rent/booth?booth=${selectedFormBooth.id}`}
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-purple-700 font-bold">대여 폼 연결 주소</Label>
                                            <div className="bg-white px-4 py-2 rounded-lg border text-sm font-mono text-gray-500 break-all">
                                                {`${window.location.origin}/rent/booth?booth=${selectedFormBooth.id}`}
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 bg-purple-600 hover:bg-purple-700 font-bold"
                                                onClick={() => {
                                                    const svg = document.querySelector('#form-qr-container svg');
                                                    if (!svg) return;
                                                    const svgDataArr = new XMLSerializer().serializeToString(svg);
                                                    const canvas = document.createElement('canvas');
                                                    canvas.width = 1000; // High resolution
                                                    canvas.height = 1000;
                                                    const ctx = canvas.getContext('2d');
                                                    const img = new Image();
                                                    img.onload = () => {
                                                        if (ctx) {
                                                            ctx.fillStyle = "white";
                                                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                                                            ctx.drawImage(img, 0, 0, 1000, 1000);
                                                            const pngFile = canvas.toDataURL("image/png");
                                                            const downloadLink = document.createElement("a");
                                                            downloadLink.download = `${selectedFormBooth.name}_대여폼_QR.png`;
                                                            downloadLink.href = `${pngFile}`;
                                                            downloadLink.click();
                                                        }
                                                    };
                                                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgDataArr)));
                                                    toast.success('QR 코드가 저장되었습니다.');
                                                }}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                이미지 다운로드
                                            </Button>
                                            <Button
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
                                                onClick={() => {
                                                    const svg = document.querySelector('#form-qr-container svg');
                                                    if (!svg) return;
                                                    const svgData = new XMLSerializer().serializeToString(svg);
                                                    const printWindow = window.open('', '_blank');
                                                    if (!printWindow) return;
                                                    
                                                    printWindow.document.write(`
                                                        <html>
                                                            <head>
                                                                <title>${selectedFormBooth.name} - 대여 폼 QR</title>
                                                                <style>
                                                                    @page { margin: 0; }
                                                                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                                                                    .container { text-align: center; border: 1px solid #eee; padding: 40px; border-radius: 20px; }
                                                                    h1 { margin-bottom: 20px; font-size: 24px; color: #333; }
                                                                    .qr-wrapper { margin-bottom: 20px; }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <div class="container">
                                                                    <h1>${selectedFormBooth.name} 대여 폼</h1>
                                                                    <div class="qr-wrapper">${svgData}</div>
                                                                </div>
                                                                <script>
                                                                    // Fix SVG size for print
                                                                    const svg = document.querySelector('svg');
                                                                    svg.setAttribute('width', '400');
                                                                    svg.setAttribute('height', '400');
                                                                    window.onload = () => {
                                                                        window.print();
                                                                        window.onafterprint = () => window.close();
                                                                    };
                                                                </script>
                                                            </body>
                                                        </html>
                                                    `);
                                                    printWindow.document.close();
                                                }}
                                            >
                                                <Printer className="w-4 h-4 mr-2" />
                                                QR 인쇄하기
                                            </Button>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                                                onClick={() => {
                                                    const url = `${window.location.origin}/rent/booth?booth=${selectedFormBooth.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.success('대여 폼 URL이 복사되었습니다!');
                                                }}
                                            >
                                                <Copy className="w-4 h-4 mr-2" />
                                                URL 복사
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Form Editor Modal */}
                    {formEditorOpen && formEditorBooth && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileEdit className="w-5 h-5" />
                                        신청 폼 편집
                                    </CardTitle>
                                    <p className="text-sm text-gray-500">{formEditorBooth.name}</p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* 기존 필드 목록 */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">등록된 필드</Label>
                                        {formFieldsLoading ? (
                                            <p className="text-sm text-gray-400">불러오는 중...</p>
                                        ) : formFields.length === 0 ? (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 text-center">
                                                <p className="text-sm text-gray-400">등록된 커스텀 필드가 없습니다.</p>
                                                <p className="text-xs text-gray-400 mt-1">아래에서 새 필드를 추가해주세요.</p>
                                            </div>
                                        ) : (
                                            <Reorder.Group
                                                axis="y"
                                                values={formFields}
                                                onReorder={handleReorder}
                                                className="space-y-2"
                                            >
                                                {formFields.map((field) => (
                                                    <Reorder.Item
                                                        key={field.id}
                                                        value={field}
                                                        className="flex items-center gap-3 bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing"
                                                    >
                                                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{field.label}</span>
                                                                {field.required && (
                                                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">필수</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-xs text-gray-400">{FIELD_TYPE_LABELS[field.type]}</span>
                                                                {field.options && (
                                                                    <span className="text-xs text-gray-400">
                                                                        · {(field.options as string[]).join(', ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking delete
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteField(field.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </Reorder.Item>
                                                ))}
                                            </Reorder.Group>
                                        )}
                                    </div>

                                    {/* 새 필드 추가 영역 */}
                                    <div className="border-t pt-4 space-y-4">
                                        <Label className="text-sm font-semibold flex items-center gap-1">
                                            <Plus className="w-4 h-4" />
                                            새 필드 추가
                                        </Label>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">필드 타입 선택</Label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {FIELD_TYPES.map(ft => {
                                                        const IconComponent = ft.icon;
                                                        const isSelected = newFieldType === ft.id;
                                                        return (
                                                            <div
                                                                key={ft.id}
                                                                onClick={() => {
                                                                    setNewFieldType(ft.id as FormField['type']);
                                                                    setNewFieldOptions([]);
                                                                    setOptionInput('');
                                                                    setPrivacyCheckboxText('');
                                                                }}
                                                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-[hsl(264,100%,41%)] bg-[hsl(264,100%,41%)]/5 text-[hsl(264,100%,41%)]' : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                                                            >
                                                                <IconComponent className="w-5 h-5 mb-1.5" />
                                                                <span className="text-[11px] font-bold text-center tracking-tight">{ft.label}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">질문 제목</Label>
                                                <Input
                                                    placeholder="예: 여행 만족도는 어떠셨나요?"
                                                    value={newFieldLabel}
                                                    onChange={e => setNewFieldLabel(e.target.value)}
                                                    className="h-11 rounded-xl bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[hsl(264,100%,41%)] focus-visible:ring-offset-0 focus-visible:border-[hsl(264,100%,41%)] transition-all"
                                                />
                                            </div>

                                            {(newFieldType === 'select' || newFieldType === 'multi_select') && (
                                                <div className="space-y-2">
                                                    <Label className="text-xs">선택 옵션 추가 (입력 후 Enter 혹은 추가버튼)</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="예: 대만족"
                                                            value={optionInput}
                                                            onChange={e => setOptionInput(e.target.value)}
                                                            className="h-11 rounded-xl bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[hsl(264,100%,41%)] focus-visible:ring-offset-0 focus-visible:border-[hsl(264,100%,41%)] transition-all"
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    if (optionInput.trim() && !newFieldOptions.includes(optionInput.trim())) {
                                                                        setNewFieldOptions([...newFieldOptions, optionInput.trim()]);
                                                                        setOptionInput('');
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            className="h-11 rounded-xl px-5 transition-colors hover:bg-[hsl(264,100%,41%)] hover:text-white"
                                                            onClick={() => {
                                                                if (optionInput.trim() && !newFieldOptions.includes(optionInput.trim())) {
                                                                    setNewFieldOptions([...newFieldOptions, optionInput.trim()]);
                                                                    setOptionInput('');
                                                                }
                                                            }}
                                                        >추가</Button>
                                                    </div>
                                                    {newFieldOptions.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-xl min-h-[50px]">
                                                            {newFieldOptions.map(opt => (
                                                                <span key={opt} className="inline-flex items-center gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-full bg-[hsl(264,100%,41%)] text-white text-[13px] font-bold shadow-sm">
                                                                    {opt}
                                                                    <button type="button" onClick={() => setNewFieldOptions(newFieldOptions.filter(o => o !== opt))} className="bg-white/20 hover:bg-white/40 rounded-full p-1 transition-colors">
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {newFieldType === 'privacy' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">약관 내용 입력</Label>
                                                        <textarea
                                                            placeholder="동의받을 약관 전문을 입력해주세요."
                                                            value={optionInput}
                                                            onChange={e => setOptionInput(e.target.value)}
                                                            rows={5}
                                                            className="w-full py-3 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[hsl(264,100%,41%)] shadow-sm text-sm outline-none font-medium text-gray-800 resize-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">체크박스 동의 문구 (미입력 시 기본문구 노출)</Label>
                                                        <Input
                                                            placeholder="예: 개인정보 수집 및 초상권 이용에 동의하시겠습니까?"
                                                            value={privacyCheckboxText}
                                                            onChange={e => setPrivacyCheckboxText(e.target.value)}
                                                            className="h-11 rounded-xl bg-gray-50 border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[hsl(264,100%,41%)] transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={newFieldRequired}
                                                onCheckedChange={setNewFieldRequired}
                                            />
                                            <Label className="text-xs text-gray-600">필수 항목</Label>
                                        </div>

                                        <Button
                                            className="w-full h-11 rounded-xl text-base font-bold shadow-md shadow-black/5 hover:-translate-y-0.5 transition-all"
                                            onClick={handleAddField}
                                            disabled={isAddingField || !newFieldLabel.trim()}
                                        >
                                            {isAddingField ? '추가 중...' : '필드 추가하기'}
                                        </Button>
                                    </div>

                                    <div className="flex justify-end pt-2 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setFormEditorOpen(false);
                                                setFormEditorBooth(null);
                                                setFormFields([]);
                                                setNewFieldLabel('');
                                                setNewFieldType('text');
                                                setNewFieldRequired(false);
                                                setNewFieldOptions([]);
                                                setOptionInput('');
                                            }}
                                        >
                                            닫기
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
