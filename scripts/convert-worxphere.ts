/**
 * Worxphere 브랜드 가이드라인 JSON → KnowledgeGraph 변환 스크립트
 * 실행: npx tsx scripts/convert-worxphere.ts
 */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

interface KGNode {
  id: string;
  label: string;
  type?: string;
}

interface KGTriple {
  id: string;
  subject: string;
  predicate: string;
  object: string;
}

interface KGRule {
  id: string;
  name: string;
  expression: string;
  type: "constraint" | "inference" | "validation";
  condition: {
    nodeType: string;
    predicate: string;
    operator: "must_have" | "must_not_have" | "conflicts_with";
    conflictPredicate?: string;
  };
}

const nodes: KGNode[] = [];
const triples: KGTriple[] = [];
const rules: KGRule[] = [];

function addNode(label: string, type?: string): string {
  const existing = nodes.find((n) => n.label === label && n.type === type);
  if (existing) return existing.id;
  const id = randomUUID();
  nodes.push({ id, label, type });
  return id;
}

function addTriple(subject: string, predicate: string, object: string) {
  const exists = triples.some(
    (t) => t.subject === subject && t.predicate === predicate && t.object === object
  );
  if (exists) return;
  triples.push({ id: randomUUID(), subject, predicate, object });
}

function addRule(
  name: string,
  expression: string,
  type: KGRule["type"],
  condition: KGRule["condition"]
) {
  rules.push({ id: randomUUID(), name, expression, type, condition });
}

// --- Read source ---
const srcPath = path.join(process.cwd(), "data", "worxphere.kg.json");
const raw = JSON.parse(fs.readFileSync(srcPath, "utf-8"));

// ============================================================
// 1. Brand (root node)
// ============================================================
const brandId = addNode("Worxphere", "브랜드");

// ============================================================
// 2. Strategy
// ============================================================

// Name origin
const nameId = addNode("웍스피어 (Worxphere)", "브랜드명");
addTriple(brandId, "has_name", nameId);

const nameOriginId = addNode(raw.strategy.name.origin, "정의");
addTriple(nameId, "origin", nameOriginId);

const nameMeaningId = addNode(raw.strategy.name.meaning, "정의");
addTriple(nameId, "meaning", nameMeaningId);

// Mission
const missionId = addNode(raw.strategy.mission.title, "미션");
addTriple(brandId, "has_mission", missionId);
const missionDescId = addNode(raw.strategy.mission.description, "설명");
addTriple(missionId, "described_by", missionDescId);

// Vision
const visionId = addNode(raw.strategy.vision.title, "비전");
addTriple(brandId, "has_vision", visionId);
const visionMsgId = addNode(raw.strategy.vision.message, "설명");
addTriple(visionId, "described_by", visionMsgId);

// Core values
for (const val of raw.strategy.core.values) {
  const valId = addNode(val.title, "핵심가치");
  addTriple(brandId, "has_core_value", valId);
  const descId = addNode(val.description, "설명");
  addTriple(valId, "described_by", descId);
}

// Slogans
for (const slogan of raw.strategy.slogan) {
  const sloganId = addNode(slogan.title, "슬로건");
  addTriple(brandId, "has_slogan", sloganId);
  const descId = addNode(slogan.description, "설명");
  addTriple(sloganId, "described_by", descId);
}

// ============================================================
// 3. Logo
// ============================================================
const logoId = addNode("Logotype", "로고");
addTriple(brandId, "has_logo", logoId);

const logoConceptId = addNode(raw.elements.logo.logo.designConcept, "디자인컨셉");
addTriple(logoId, "design_concept", logoConceptId);

// Logo variants
for (const variant of raw.elements.logo.variants) {
  const variantId = addNode(`Logo ${variant.type}`, "로고변형");
  addTriple(logoId, "has_variant", variantId);
}

// Logo incorrect usage rules
const logoIncorrect = raw.elements.logo.incorrectUsage.example;
for (const [category, items] of Object.entries(logoIncorrect)) {
  for (const item of items as string[]) {
    addRule(
      `로고 ${category} 금지`,
      item,
      "constraint",
      { nodeType: "로고", predicate: "incorrect_usage", operator: "must_not_have" }
    );
  }
}

// ============================================================
// 4. Colors
// ============================================================

// Main colors
for (const color of raw.elements.color.main.colors) {
  const colorId = addNode(`${color.name} (${color.hex})`, "컬러");
  addTriple(brandId, "has_main_color", colorId);
  if (color.description) {
    const descId = addNode(color.description, "설명");
    addTriple(colorId, "described_by", descId);
  }
  // Role triple
  const roleId = addNode(color.role, "컬러역할");
  addTriple(colorId, "has_role", roleId);
}

// Sub colors (flatten nested arrays)
for (const group of raw.elements.color.sub.colors) {
  for (const color of group) {
    const colorId = addNode(`${color.name} (${color.hex})`, "컬러");
    addTriple(brandId, "has_sub_color", colorId);
  }
}

// Background colors
for (const color of raw.elements.color.background.colors) {
  const colorId = addNode(`${color.name} (${color.hex})`, "컬러");
  addTriple(brandId, "has_background_color", colorId);
}

// Color incorrect usage rules
const colorIncorrect = raw.elements.color.incorrectUsages;
for (const [category, items] of Object.entries(colorIncorrect)) {
  for (const item of items as string[]) {
    addRule(
      `컬러 ${category} 금지`,
      item,
      "constraint",
      { nodeType: "컬러", predicate: "incorrect_usage", operator: "must_not_have" }
    );
  }
}

// Color background rule
if (raw.elements.color.sub.rule) {
  addRule(
    "배경 컬러 로고 적용 규칙",
    raw.elements.color.sub.rule,
    "constraint",
    { nodeType: "컬러", predicate: "background_logo_rule", operator: "must_have" }
  );
}

// ============================================================
// 5. Typography
// ============================================================
for (const font of raw.elements.typography.main) {
  const fontId = addNode(`${font.name} (${font.language})`, "서체");
  addTriple(brandId, "has_typography", fontId);

  const usageId = addNode(font.usage, "설명");
  addTriple(fontId, "usage", usageId);

  // Weights
  for (const w of font.weights) {
    const wId = addNode(w, "폰트굵기");
    addTriple(fontId, "has_weight", wId);
  }

  // Do rules
  for (const rule of font.doRules) {
    addRule(
      `${font.name} 사용 규칙`,
      rule,
      "validation",
      { nodeType: "서체", predicate: "do_rule", operator: "must_have" }
    );
  }

  // Don't rules
  for (const rule of font.dontRules) {
    addRule(
      `${font.name} 금지 규칙`,
      rule,
      "constraint",
      { nodeType: "서체", predicate: "dont_rule", operator: "must_not_have" }
    );
  }
}

// Micro typography
for (const micro of raw.elements.typography.micro) {
  const microId = addNode(micro.name, "서체");
  addTriple(brandId, "has_typography", microId);

  const usageId = addNode(micro.usage, "설명");
  addTriple(microId, "usage", usageId);

  for (const rule of micro.doRules) {
    addRule(
      `${micro.name} 사용 규칙`,
      rule,
      "validation",
      { nodeType: "서체", predicate: "do_rule", operator: "must_have" }
    );
  }
}

// ============================================================
// 6. Name rule
// ============================================================
if (raw.strategy.name.rule) {
  addRule(
    "기업명 표기 규칙",
    raw.strategy.name.rule,
    "constraint",
    { nodeType: "브랜드명", predicate: "naming_rule", operator: "must_have" }
  );
}

// ============================================================
// Output
// ============================================================
const kg = {
  metadata: {
    name: "Worxphere 브랜드 가이드라인",
    created: "2026-01-20",
    updated: new Date().toISOString().split("T")[0],
  },
  nodes,
  triples,
  rules,
};

const outPath = path.join(process.cwd(), "data", "worxphere.kg.json");
fs.writeFileSync(outPath, JSON.stringify(kg, null, 2));

console.log(`✓ 변환 완료`);
console.log(`  노드: ${nodes.length}개`);
console.log(`  관계: ${triples.length}개`);
console.log(`  규칙: ${rules.length}개`);
console.log(`  저장: ${outPath}`);
