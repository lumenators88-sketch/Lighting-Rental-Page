const fs = require('fs');
const path = require('path');

// 합칠 마크다운 파일들이 있는 폴더 경로 (기본값: 스크립트를 실행한 현재 폴더)
// 터미널에서 `node merge-md.js ./downloads` 처럼 경로를 인자로 넘길 수 있습니다.
const MD_DIR = process.argv[2] || './';
// 결과물이 저장될 파일 이름
const OUTPUT_FILE = 'combined_result.md';

function mergeMarkdownFiles(dirPath) {
    let combinedContent = '';

    try {
        // 1. 디렉토리 내의 모든 파일 읽기
        const files = fs.readdirSync(dirPath);

        // 2. .md 파일만 필터링 (결과물 파일은 제외)
        const mdFiles = files.filter(
            (file) => file.endsWith('.md') && file !== OUTPUT_FILE
        );

        console.log(`총 ${mdFiles.length}개의 마크다운 파일을 찾았습니다.\n`);

        if (mdFiles.length === 0) {
            console.log('병합할 마크다운 파일이 없습니다.');
            return;
        }

        // 3. 각 파일을 순회하며 내용 합치기
        mdFiles.forEach((file) => {
            const filePath = path.join(dirPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // 파일 구분을 위해 헤딩과 파일명을 추가하고 내용을 이어붙임
            combinedContent += `\n\n---\n\n## 📄 파일명: ${file}\n\n${content}\n`;
            console.log(`- ${file} 병합 완료`);
        });

        // 4. 결과 파일로 저장
        const outputPath = path.join(dirPath, OUTPUT_FILE);
        fs.writeFileSync(outputPath, combinedContent.trim());

        console.log(`\n✅ 모든 파일이 성공적으로 병합되었습니다!`);
        console.log(`저장 위치: ${outputPath}`);
    } catch (error) {
        console.error('파일을 읽거나 병합하는 중 오류가 발생했습니다:', error.message);
    }
}

mergeMarkdownFiles(MD_DIR);
