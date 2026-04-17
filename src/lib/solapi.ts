// import { SolapiMessageService } from 'solapi';
// const messageService = new SolapiMessageService(
//     process.env.SOLAPI_API_KEY || '',
//     process.env.SOLAPI_API_SECRET || ''
// );

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function sendRentalNotification(_phone: string, _name: string, _umbrellaId: string) {
    // 알림톡 (한도 복구 후 아래 주석 해제)
    // const targetPhone = _phone.replace(/[^0-9]/g, '');
    // await messageService.send({
    //     to: targetPhone,
    //     from: process.env.SOLAPI_SENDER_NUMBER || '',
    //     kakaoOptions: {
    //         pfId: process.env.SOLAPI_PFID || '',
    //         templateId: process.env.SOLAPI_TEMPLATE_ID || '',
    //         variables: { 이름: _name, 우산번호: _umbrellaId }
    //     }
    // });

    // SMS (발신번호 등록 후 아래 주석 해제)
    // const targetPhone = _phone.replace(/[^0-9]/g, '');
    // const text = `<별빛우산체험 이용안내>
    //
    // 대여자: ${_name} 님
    // 대여 별빛 우산번호 : ${_umbrellaId}
    //
    // 체험 시간은 20분이며,
    // 다른 이용자분들을 위해
    // 20분 이내 반납을 부탁드립니다🙂
    //
    // 미반납 시, 절도 등 관련 법에 따라
    // 법적 책임이 발생할 수 있으며,
    // 허위 정보 기재 시 이용이 제한될 수 있습니다.
    //
    // 📷촬영팁
    // 별빛우산으로
    // 예쁘게 사진 찍는 방법
    // ↓↓↓↓↓↓↓↓↓
    // https://url.kr/ywvfkc
    //
    // ☎문의
    // 안전사고발생 및
    // 기타관련문의
    // ↓↓↓↓↓↓
    // 051-255-2080`;
    // await messageService.send({
    //     to: targetPhone,
    //     from: process.env.SOLAPI_SENDER_NUMBER || '',
    //     text,
    // });

    return { success: true };
}
