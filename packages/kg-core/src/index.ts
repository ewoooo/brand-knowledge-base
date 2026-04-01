export type {
  PropertyDef,
  NodeType,
  LinkType,
  TypeRegistry,
  TripleMetadata,
  Triple,
  Node,
  RuleCondition,
  Rule,
  KnowledgeGraph,
  ValidationResult,
} from "./types";

export {
  createEmptyGraph,
  addNode,
  removeNode,
  updateNode,
  addTriple,
  removeTriple,
  updateTriple,
  addRule,
  updateRule,
  removeRule,
  addPropertyDef,
  removePropertyDef,
  updatePropertyDef,
} from "./operations";

export { validate } from "./validator";

export { normalizeType } from "./normalize-type";

export {
  toJSON,
  fromJSON,
  generateId,
  serializeGraphForPrompt,
} from "./serializer";
