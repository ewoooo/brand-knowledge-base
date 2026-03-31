/**
 * PascalCase / camelCase → kebab-case 변환.
 * 노드 타입 정규화에 사용. 이미 kebab-case/소문자면 그대로 반환.
 */
export function normalizeType(type: string): string;
export function normalizeType(type: string | undefined): string | undefined;
export function normalizeType(type: string | undefined): string | undefined {
    if (type === undefined) return undefined;
    if (type === "") return "";

    return (
        type
            // 연속 대문자 + 소문자 경계: "AI|Illustration" → "AI-Illustration"
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
            // 소문자/숫자 + 대문자 경계: "Brand|Name" → "Brand-Name"
            .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
            .toLowerCase()
    );
}
