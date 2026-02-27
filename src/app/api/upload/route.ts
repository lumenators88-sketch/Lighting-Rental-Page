import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const base64Image = body.image || body.file; // data:image/jpeg;base64,...

        if (!base64Image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Extract base64 content type and actual data
        const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            return NextResponse.json({ error: 'Invalid Base64 format' }, { status: 400 });
        }

        const type = matches[1];
        const data = Buffer.from(matches[2], 'base64');
        const ext = type.split('/')[1] || 'jpeg';

        // Generate a random unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to Supabase Storage Bucket ('booths')
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('booths')
            .upload(filename, data, {
                contentType: type,
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Get public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('booths')
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrlData.publicUrl });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Image upload failed' },
            { status: 500 }
        );
    }
}
