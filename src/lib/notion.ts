import { Client } from '@notionhq/client';

export const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

export async function addRentalRecordToNotion(data: {
    umbrellaId: string;
    phone: string;
    boothName: string;
    rentedAt: Date;
}) {
    if (!NOTION_DATABASE_ID || !process.env.NOTION_API_KEY) return null;

    try {
        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
                '우산 바코드': {
                    title: [
                        {
                            text: {
                                content: data.umbrellaId,
                            },
                        },
                    ],
                },
                '전화번호': {
                    rich_text: [
                        {
                            text: {
                                content: data.phone,
                            },
                        },
                    ],
                },
                '대여 행상': {
                    rich_text: [
                        {
                            text: {
                                content: data.boothName,
                            },
                        },
                    ],
                },
                '대여 시간': {
                    date: {
                        start: data.rentedAt.toISOString(),
                    },
                },
                '상태': {
                    select: {
                        name: '대여중',
                    },
                },
            },
        });
        return response;
    } catch (error) {
        console.error('Failed to save to Notion:', error);
        return null;
    }
}

export async function updateRentalReturnInNotion(
    umbrellaId: string,
    returnedAt: Date
) {
    if (!NOTION_DATABASE_ID || !process.env.NOTION_API_KEY) return null;

    try {
        // 1. Find the page in notion
        // @ts-ignore
        const query = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            filter: {
                and: [
                    {
                        property: '우산 바코드',
                        title: {
                            equals: umbrellaId,
                        },
                    },
                    {
                        property: '상태',
                        select: {
                            equals: '대여중',
                        },
                    },
                ],
            },
        });

        if (query.results.length === 0) return null;

        const pageId = query.results[0].id;

        // 2. Update the page
        const response = await notion.pages.update({
            page_id: pageId,
            properties: {
                '반납 시간': {
                    date: {
                        start: returnedAt.toISOString(),
                    },
                },
                '상태': {
                    select: {
                        name: '반납완료',
                    },
                },
            },
        });

        return response;
    } catch (error) {
        console.error('Failed to update Notion:', error);
        return null;
    }
}
