/** 속성값의 시각적 타입을 판별하는 유틸 */

export function isHexColor(value: string): boolean {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
