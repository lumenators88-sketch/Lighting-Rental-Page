import { Client } from '@notionhq/client';

export const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

/**
 * Exports a single rental customData (survey responses) to Notion.
 * Creates one Notion page (row) per survey response.
 */
export async function exportSingleSurveyToNotion(
    boothName: string,
    timestamp: string,
    surveyData: any,
    eventType: 'RENT' | 'RETURN' = 'RETURN'
) {
    console.log('[Notion Export] Function called:', {
        boothName,
        timestamp,
        eventType,
        surveyDataKeys: Object.keys(surveyData),
        callTime: new Date().toISOString()
    });

    if (!NOTION_DATABASE_ID || !process.env.NOTION_API_KEY) {
        console.warn("Notion credentials not configured. Skipping survey export.");
        return;
    }

    if (!surveyData || Object.keys(surveyData).length === 0) {
        return;
    }

    const eventLabel = eventType === 'RENT' ? '대여 일시' : '완료(반납) 일시';

    try {
        // 1. Format the survey JSON into readable text blocks
        const blocks: any[] = [
            {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: [{ type: 'text', text: { content: '📋 설문 응답 내용' } }]
                }
            },
            {
                object: 'block',
                type: 'divider',
                divider: {}
            }
        ];

        // Convert customData JSON strictly into Q&A blocks
        Object.entries(surveyData).forEach(([question, answer]) => {
            // Question block
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: 'Q: ' },
                            annotations: { bold: true, color: 'purple' }
                        },
                        {
                            type: 'text',
                            text: { content: question },
                            annotations: { bold: true }
                        }
                    ]
                }
            });

            // Answer block
            let answerText = String(answer);
            if (Array.isArray(answer)) {
                answerText = answer.join(', ');
            } else if (typeof answer === 'boolean') {
                answerText = answer ? '네' : '아니오';
            }

            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [
                        {
                            type: 'text',
                            text: { content: 'A: ' },
                            annotations: { bold: true, color: 'gray' }
                        },
                        {
                            type: 'text',
                            text: { content: answerText }
                        }
                    ]
                }
            });

            // Empty line for spacing
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: [] }
            });
        });

        // 2. Create the Notion Page (Row)
        console.log('[Notion Export] Creating Notion page for:', boothName);
        await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
                // Title Column (Must exist by default in Notion)
                // We assume the Notion DB has a default title column which we rename to "대여 행사명"
                // In Notion API, we just target 'title' regardless of what the user named it.
                "title": {
                    title: [
                        {
                            text: { content: boothName },
                        },
                    ],
                }
            },
            // Inject the Date directly into the page content instead of a column
            // to avoid requiring the user to actually create a Date column.
            children: [
                {
                    object: 'block',
                    type: 'callout',
                    callout: {
                        rich_text: [
                            { type: 'text', text: { content: `📆 ${eventLabel}: ` }, annotations: { bold: true } },
                            { type: 'text', text: { content: new Date(timestamp).toLocaleString('ko-KR') } }
                        ],
                        icon: { type: 'emoji', emoji: '⏰' }
                    }
                },
                ...blocks
            ]
        });
        console.log('[Notion Export] Successfully created Notion page for:', boothName);
    } catch (error) {
        console.error("[Notion Export] Failed to export individual survey to Notion:", error);
    }
}
