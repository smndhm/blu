export { RULES, transformHtml, type Finding, type RuleId, type TransformOptions, type TransformResult } from './transform.js';
export { supplementaryRules, conditionalAttributes, conditionReasons, type ConditionId, type SupplementaryRule } from './defaults.js';
export { ariaDefaults, implicitRole, keptRedundantRoles, nativeDuplicates, type AriaDefault, type ElementView, type NativeDuplicate } from './aria.js';
export { collectReferences, createReferences, findReference, type AttributeReference, type AttributeReferences, type SourceKind } from './references.js';
export { processFiles, readReferences, run, type FileReport, type ProcessOptions } from './cli.js';
export { default as codemodTransform, type SgRootLike } from './codemod.js';
export { ariaTokens, findKeywordAttribute, isValidKeyword, keywordAttributes, type KeywordAttribute } from './invalid.js';
