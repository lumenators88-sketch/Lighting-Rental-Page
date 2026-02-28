import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: booths, error } = await supabase
            .from('Booth')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ booths });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch booths' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, photoUrl, umbrellaStartNumber = null, umbrellaEndNumber = null, formFields = [] } = body;

        if (!name || !photoUrl) {
            return NextResponse.json(
                { error: 'Missing name or photoUrl' },
                { status: 400 }
            );
        }

        const { data: booth, error } = await supabase
            .from('Booth')
            .insert([
                {
                    // UUID generation handles by DB or we generate here
                    id: crypto.randomUUID(),
                    name,
                    photoUrl,
                    umbrellaStartNumber: umbrellaStartNumber ? parseInt(umbrellaStartNumber, 10) : null,
                    umbrellaEndNumber: umbrellaEndNumber ? parseInt(umbrellaEndNumber, 10) : null
                }
            ])
            .select()
            .single();

        if (error) throw error;

        // Assign umbrellas to this booth if range is provided
        const startNum = umbrellaStartNumber ? parseInt(umbrellaStartNumber, 10) : null;
        const endNum = umbrellaEndNumber ? parseInt(umbrellaEndNumber, 10) : null;
        if (startNum && endNum && booth) {
            await supabase
                .from('Umbrella')
                .update({ currentBoothId: booth.id, updatedAt: new Date().toISOString() })
                .gte('umbrellaNumber', startNum)
                .lte('umbrellaNumber', endNum);
        }

        // Insert initial form fields if provided
        if (formFields && formFields.length > 0 && booth) {
            const fieldsToInsert = formFields.map((field: any, index: number) => ({
                boothId: booth.id,
                label: field.label,
                type: field.type,
                options: field.options,
                required: field.required,
                fieldOrder: index,
            }));

            const { error: fieldsError } = await supabase
                .from('FormField')
                .insert(fieldsToInsert);

            if (fieldsError) {
                console.error("Error inserting form fields during booth creation:", fieldsError);
                // We don't fail the whole booth creation just for fields, but we should log it
            }
        }

        return NextResponse.json({ success: true, booth });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create booth' },
            { status: 500 }
        );
    }
}
