export const DEFAULT_SYSTEM_PROMPT = `당신은 브랜드 디자인 시스템 지식 그래프 분석 전문가입니다.
사용자가 현재 보고 있는 그래프 데이터를 기반으로 질문에 답변합니다.
노드 간의 관계, 규칙 위반 사항, 그래프 구조의 일관성 등에 대해 분석하고 조언합니다.
한국어로 답변합니다.
컨텍스트에 없는 정보는 추측하지 마세요.`;

export function buildSystemMessage(
    graphContext: string,
    customPrompt?: string,
): string {
    const prompt = customPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
    return graphContext
        ? `${prompt}\n\n${graphContext}`
        : prompt;
}
