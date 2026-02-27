import { supabase } from '@/lib/supabase';
import RentForm from '@/components/customer/RentForm';

interface PageProps {
    searchParams: Promise<{ booth?: string }>;
}

export default async function RentPage({ searchParams }: PageProps) {
    const { booth: boothId } = await searchParams;

    if (!boothId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">안내</h1>
                    <p className="text-gray-600">비정상적인 접근입니다. (행사 정보 없음)</p>
                </div>
            </div>
        );
    }

    const { data: booth } = await supabase
        .from('Booth')
        .select('*')
        .eq('id', boothId)
        .single();

    if (!booth || !booth.isActive) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">안내</h1>
                    <p className="text-gray-600">운영 중이 아닌 행사입니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            <RentForm
                boothId={booth.id}
                boothName={booth.name}
                boothPhotoUrl={booth.photoUrl}
            />
        </div>
    );
}
