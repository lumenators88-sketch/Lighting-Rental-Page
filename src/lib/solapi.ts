import { SolapiMessageService } from 'solapi';

/**
 * 솔라피 메시지 서비스 인스턴스 초기화
 */
const apiKey = process.env.SOLAPI_API_KEY || '';
const apiSecret = process.env.SOLAPI_API_SECRET || '';
const messageService = new SolapiMessageService(apiKey, apiSecret);

/**
 * 대여 완료 알림톡(카카오) 발송 함수
 * @param phone 수신자 휴대폰 번호
 */
export async function sendRentalNotification(phone: string) {
    if (!process.env.SOLAPI_API_KEY || !process.env.SOLAPI_TEMPLATE_ID) {
        console.warn('[Solapi] 연동 정보가 설정되지 않아 알림톡 발송을 스킵합니다.');
        return;
    }

    try {
        // 하이픈 제거 및 숫자만 추출
        const targetPhone = phone.replace(/[^0-9]/g, '');

        const response = await messageService.send({
            to: targetPhone,
            from: process.env.SOLAPI_SENDER_NUMBER || '',
            kakaoOptions: {
                pfId: process.env.SOLAPI_PFID || '',
                templateId: process.env.SOLAPI_TEMPLATE_ID || '',
                // 변수가 없는 정적 템플릿의 경우 variables를 비워두거나 생략합니다.
                variables: {}
            }
        });

        console.log('[Solapi Success]: Notification sent to', targetPhone, response);
        return { success: true, response };
    } catch (error) {
        console.error('[Solapi Error]: Failed to send notification:', error);
        return { success: false, error };
    }
}
