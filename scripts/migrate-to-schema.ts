/**
 * worxphere.kg.json에 TypeRegistry 스키마를 추가하는 마이그레이션 스크립트.
 *
 * 실행: npx tsx scripts/migrate-to-schema.ts
 * 결과: data/worxphere.kg.json이 schema + schemaVersion이 추가된 형태로 덮어쓰기
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { NodeType, LinkType, TypeRegistry } from "@knowledgeview/kg-core";

const DATA_PATH = resolve(process.cwd(), "data/worxphere.kg.json");

// --- NodeType 정의 (16개) ---

const nodeTypes: NodeType[] = [
    {
        type: "brand",
        displayName: "브랜드",
        description:
            "기업/제품 브랜드의 최상위 엔티티. 모든 브랜드 자산(색상, 서체, 로고 등)의 소유자.",
        properties: [],
        visual: { color: "#6496ff", size: 36 },
    },
    {
        type: "brand-name",
        displayName: "브랜드명",
        description: "브랜드의 공식 명칭과 표기법.",
        properties: [],
        visual: { color: "#8b5cf6", size: 24 },
    },
    {
        type: "name-origin",
        displayName: "이름 유래",
        description: "브랜드명의 어원과 의미.",
        properties: [],
        visual: { color: "#a78bfa", size: 20 },
    },
    {
        type: "mission",
        displayName: "미션",
        description: "브랜드가 존재하는 이유와 목적을 선언하는 문장.",
        properties: [],
        visual: { color: "#f59e0b", size: 28 },
    },
    {
        type: "vision",
        displayName: "비전",
        description: "브랜드가 지향하는 미래상.",
        properties: [],
        visual: { color: "#f59e0b", size: 28 },
    },
    {
        type: "core-value",
        displayName: "핵심 가치",
        description:
            "브랜드의 의사결정과 행동 기준이 되는 핵심 가치. 모든 커뮤니케이션과 디자인에 반영되어야 함.",
        properties: [],
        visual: { color: "#10b981", size: 24 },
    },
    {
        type: "slogan",
        displayName: "슬로건",
        description: "브랜드의 핵심 메시지를 함축한 태그라인.",
        properties: [],
        visual: { color: "#ec4899", size: 22 },
    },
    {
        type: "color",
        displayName: "색상",
        description:
            "브랜드 색상 팔레트의 개별 색상. 이름, 용도, 색상 계열을 가진다.",
        properties: [
            {
                key: "hexCode",
                displayName: "HEX 코드",
                valueType: "string",
                description: "색상의 HEX 코드 (예: #2E5BFF)",
            },
            {
                key: "category",
                displayName: "분류",
                valueType: "enum",
                enumValues: [
                    "primary",
                    "secondary",
                    "accent",
                    "neutral",
                    "mono",
                ],
                description: "색상 팔레트 내 분류",
            },
        ],
        visual: { color: "#ff5733", size: 20 },
    },
    {
        type: "typography",
        displayName: "서체",
        description: "브랜드에서 사용하는 공식 서체.",
        properties: [
            {
                key: "fontFamily",
                displayName: "폰트 패밀리",
                valueType: "string",
                description: "CSS font-family 값",
            },
            {
                key: "usage",
                displayName: "용도",
                valueType: "string",
                description: "사용 맥락 (제목, 본문, UI 등)",
            },
        ],
        visual: { color: "#06b6d4", size: 22 },
    },
    {
        type: "logo",
        displayName: "로고",
        description: "브랜드의 공식 로고 마크.",
        properties: [],
        visual: { color: "#8b5cf6", size: 28 },
    },
    {
        type: "logo-variant",
        displayName: "로고 변형",
        description: "특정 배경이나 크기에 맞게 조정된 로고 변형.",
        properties: [
            {
                key: "background",
                displayName: "배경",
                valueType: "string",
                description: "적용 배경 (밝은 배경, 어두운 배경 등)",
            },
        ],
        visual: { color: "#a78bfa", size: 22 },
    },
    {
        type: "visual-language",
        displayName: "시각 언어",
        description:
            "브랜드의 시각적 표현 체계. 하위에 구체적인 시각 유형들을 가진다.",
        properties: [],
        visual: { color: "#f97316", size: 26 },
    },
    {
        type: "visual-type",
        displayName: "시각 유형",
        description: "시각 언어의 구체적 표현 방식 (기하학적, 유기적 등).",
        properties: [],
        visual: { color: "#fb923c", size: 20 },
    },
    {
        type: "ai-illustration",
        displayName: "AI 일러스트레이션",
        description:
            "AI로 생성되는 브랜드 일러스트레이션의 스타일 가이드.",
        properties: [],
        visual: { color: "#d946ef", size: 24 },
    },
    {
        type: "application",
        displayName: "적용 매체",
        description:
            "브랜드가 적용되는 물리적/디지털 터치포인트 (명함, 웹사이트, 굿즈 등).",
        properties: [
            {
                key: "category",
                displayName: "분류",
                valueType: "enum",
                enumValues: ["print", "digital", "goods", "space"],
                description: "매체 유형",
            },
        ],
        visual: { color: "#64748b", size: 18 },
    },
    {
        type: "usage-rule",
        displayName: "사용 규칙",
        description:
            "브랜드 자산 사용 시 준수해야 할 규칙과 금지 사항.",
        properties: [
            {
                key: "severity",
                displayName: "심각도",
                valueType: "enum",
                enumValues: ["mandatory", "recommended"],
                description: "규칙의 강제성 수준",
            },
        ],
        visual: { color: "#ef4444", size: 20 },
    },
];

// --- LinkType 정의 (18개) ---

const linkTypes: LinkType[] = [
    {
        predicate: "ownsColor",
        displayName: "색상 보유",
        description: "브랜드가 소유한 공식 색상",
        sourceTypes: ["brand"],
        targetTypes: ["color"],
        cardinality: "1:N",
    },
    {
        predicate: "appliesTo",
        displayName: "적용 대상",
        description: "사용 규칙이 적용되는 매체",
        sourceTypes: ["usage-rule"],
        targetTypes: ["application"],
        cardinality: "N:N",
    },
    {
        predicate: "usesColor",
        displayName: "색상 사용",
        description: "적용 매체에서 사용하는 색상",
        sourceTypes: ["application"],
        targetTypes: ["color"],
        cardinality: "N:N",
    },
    {
        predicate: "restricts",
        displayName: "제약",
        description: "사용 규칙이 제약하는 대상",
        sourceTypes: ["usage-rule"],
        targetTypes: [],
        cardinality: "N:N",
    },
    {
        predicate: "usesLogo",
        displayName: "로고 사용",
        description: "적용 매체에서 사용하는 로고",
        sourceTypes: ["application"],
        targetTypes: ["logo", "logo-variant"],
        cardinality: "N:N",
    },
    {
        predicate: "usesTypography",
        displayName: "서체 사용",
        description: "적용 매체에서 사용하는 서체",
        sourceTypes: ["application"],
        targetTypes: ["typography"],
        cardinality: "N:N",
    },
    {
        predicate: "hasCoreValue",
        displayName: "핵심 가치",
        description: "브랜드의 핵심 가치",
        sourceTypes: ["brand"],
        targetTypes: ["core-value"],
        cardinality: "1:N",
    },
    {
        predicate: "hasSlogan",
        displayName: "슬로건",
        description: "브랜드의 슬로건",
        sourceTypes: ["brand"],
        targetTypes: ["slogan"],
        cardinality: "1:N",
    },
    {
        predicate: "hasSubType",
        displayName: "하위 유형",
        description: "시각 언어의 구체적 유형",
        sourceTypes: ["visual-language"],
        targetTypes: ["visual-type"],
        cardinality: "1:N",
    },
    {
        predicate: "ownsTypography",
        displayName: "서체 보유",
        description: "브랜드가 소유한 공식 서체",
        sourceTypes: ["brand"],
        targetTypes: ["typography"],
        cardinality: "1:N",
    },
    {
        predicate: "hasVariant",
        displayName: "변형",
        description: "로고의 변형 버전",
        sourceTypes: ["logo"],
        targetTypes: ["logo-variant"],
        cardinality: "1:N",
    },
    {
        predicate: "ownsLogo",
        displayName: "로고 보유",
        description: "브랜드가 소유한 공식 로고",
        sourceTypes: ["brand"],
        targetTypes: ["logo"],
        cardinality: "1:N",
    },
    {
        predicate: "derivedFrom",
        displayName: "유래",
        description: "브랜드명의 어원",
        sourceTypes: ["brand-name"],
        targetTypes: ["name-origin"],
        cardinality: "N:1",
    },
    {
        predicate: "hasMission",
        displayName: "미션",
        description: "브랜드의 미션 선언",
        sourceTypes: ["brand"],
        targetTypes: ["mission"],
        cardinality: "1:1",
    },
    {
        predicate: "hasName",
        displayName: "이름",
        description: "브랜드의 공식 명칭",
        sourceTypes: ["brand"],
        targetTypes: ["brand-name"],
        cardinality: "1:1",
    },
    {
        predicate: "hasVision",
        displayName: "비전",
        description: "브랜드의 비전",
        sourceTypes: ["brand"],
        targetTypes: ["vision"],
        cardinality: "1:1",
    },
    {
        predicate: "ownsIllustration",
        displayName: "일러스트 보유",
        description: "브랜드가 소유한 AI 일러스트레이션 스타일",
        sourceTypes: ["brand"],
        targetTypes: ["ai-illustration"],
        cardinality: "1:N",
    },
    {
        predicate: "ownsVisualLanguage",
        displayName: "시각 언어 보유",
        description: "브랜드가 소유한 시각 언어 체계",
        sourceTypes: ["brand"],
        targetTypes: ["visual-language"],
        cardinality: "1:1",
    },
];

// --- 실행 ---

const raw = readFileSync(DATA_PATH, "utf8");
const data = JSON.parse(raw);

const schema: TypeRegistry = { nodeTypes, linkTypes };

const migrated = {
    metadata: {
        ...data.metadata,
        schemaVersion: "2.0",
    },
    schema,
    nodes: data.nodes,
    triples: data.triples,
    rules: data.rules ?? [],
};

writeFileSync(DATA_PATH, JSON.stringify(migrated, null, 2) + "\n", "utf8");

// 검증 리포트
const typeSet = new Set(nodeTypes.map((nt) => nt.type));
const predSet = new Set(linkTypes.map((lt) => lt.predicate));
const dataTypes = new Set(data.nodes.map((n: { type: string }) => n.type));
const dataPreds = new Set(
    data.triples.map((t: { predicate: string }) => t.predicate),
);

const missingTypes = [...dataTypes].filter((t) => !typeSet.has(t));
const missingPreds = [...dataPreds].filter((p) => !predSet.has(p));

console.log("마이그레이션 완료:");
console.log(`  nodeTypes: ${nodeTypes.length}개 정의`);
console.log(`  linkTypes: ${linkTypes.length}개 정의`);
console.log(`  schemaVersion: 2.0`);
console.log(`  데이터 타입 커버리지: ${missingTypes.length === 0 ? "100%" : `누락: ${missingTypes.join(", ")}`}`);
console.log(`  predicate 커버리지: ${missingPreds.length === 0 ? "100%" : `누락: ${missingPreds.join(", ")}`}`);
