import type { TypeRegistry, LinkType } from "@knowledgeview/kg-core";

/** NodeType의 displayName을 반환. 없으면 raw type fallback */
export function getNodeTypeDisplayName(
    schema: TypeRegistry | undefined,
    type: string,
): string {
    if (!schema) return type;
    const nt = schema.nodeTypes.find((n) => n.type === type);
    return nt?.displayName ?? type;
}

/** LinkType의 displayName을 반환. 없으면 raw predicate fallback */
export function getLinkTypeDisplayName(
    schema: TypeRegistry | undefined,
    predicate: string,
): string {
    if (!schema) return predicate;
    const lt = schema.linkTypes.find((l) => l.predicate === predicate);
    return lt?.displayName ?? predicate;
}

/** LinkType 전체 정보를 반환. 없으면 null */
export function getLinkTypeInfo(
    schema: TypeRegistry | undefined,
    predicate: string,
): LinkType | null {
    if (!schema) return null;
    return schema.linkTypes.find((l) => l.predicate === predicate) ?? null;
}
