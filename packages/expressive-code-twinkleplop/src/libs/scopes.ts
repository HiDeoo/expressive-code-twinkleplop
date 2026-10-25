import type * as tokenTypes from '@twinkleplop/core/tokens'

/**
 * A hand-crafted mapping of Twinkleplop token types to TextMate scopes used by Expressive Code to color tokens.
 * Tokens mapped to `undefined` are not colored.
 *
 * Each scope was picked to match as much as possible the colors Expressive Code uses with Shiki, mostly by using the
 * {@link https://twinkleplop.pngwn.at/explore/ | Twinkleplop inspector}, the
 * {@link https://youngspe.dev/textmate-grammar-playground/ | TmLanguage and TmTheme playground} and the "Developer:
 * Inspect Editor Tokens and Scopes" command in Visual Studio Code.
 *
 * @see https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/lib/theme-github/src/tokens.ts
 */
const tokenScopes: Record<TokenType, string | undefined> = {
  // universal primitives
  boolean: 'constant.language.boolean',
  comment: 'comment',
  identifier: 'variable.other.readwrite',
  keyword: 'keyword',
  number: 'constant.numeric',
  operator: 'keyword.operator.assignment',
  punctuation: 'punctuation',
  regex: 'string.regexp',
  string: 'string.quoted',
  template: 'string.template',

  // named entities
  attribute: 'meta.attribute.rust',
  builtin: 'support.function.builtin',
  class_name: 'entity.name.type.class',
  constant: 'variable.other.constant',
  decorator: 'entity.name.function',
  lifetime: 'entity.name.type.lifetime.rust',
  namespace: 'entity.name.namespace',
  parameter: 'variable.parameter',
  property: 'meta.object-literal.key',
  type: 'support.type.primitive',
  variable: 'variable.other',
  variant: 'entity.name.type',
  function: 'entity.name.function',

  // markup (html, svelte)
  attr_name: 'entity.other.attribute-name',
  doctype: 'entity.name.tag',
  entity: 'constant.character.entity',
  tag_name: 'entity.name.tag',

  // css
  css_variable: 'variable.css',
  selector: 'entity.name.tag.css',
  selector_class: 'entity.other.attribute-name.class.css',
  selector_id: 'entity.other.attribute-name.id.css',
  selector_pseudo: 'entity.other.attribute-name.pseudo-class.css',
  unit: 'keyword.other.unit',

  // diff
  changed: 'markup.changed.diff',
  changed_marker: 'markup.changed.diff',
  deleted: 'markup.deleted.diff',
  deleted_marker: 'markup.deleted.diff',
  hash: 'meta.diff.index',
  heading: 'markup.heading.markdown',
  inserted: 'markup.inserted.diff',
  inserted_marker: 'markup.inserted.diff',
  label: 'meta.diff.range',

  // markdown content
  autolink: 'markup.underline.link.markdown',
  bold: 'markup.bold.markdown',
  code: 'markup.inline.raw.string.markdown',
  code_block: 'markup.raw.block.markdown',
  code_language: 'fenced_code.block.language',
  italic: 'markup.italic.markdown',
  link_text: 'string.other.link.title.markdown',
  strike: 'markup.strikethrough.markdown',
  url: 'markup.underline.link',
  url_link: 'punctuation.definition.metadata.markdown',
  url_title: 'string.other.link.description.title.markdown',

  // markdown open/close markers — match the content they wrap
  autolink_open: 'punctuation.definition.link.markdown',
  autolink_close: 'punctuation.definition.link.markdown',
  bold_open: 'markup.bold.markdown',
  bold_close: 'markup.bold.markdown',
  code_open: 'markup.inline.raw.string.markdown',
  code_close: 'markup.inline.raw.string.markdown',
  italic_open: 'markup.italic.markdown',
  italic_close: 'markup.italic.markdown',
  link_text_open: 'punctuation.definition.link.title.markdown',
  link_text_close: 'punctuation.definition.link.title.markdown',
  strike_open: 'punctuation.definition.strikethrough.markdown',
  strike_close: 'punctuation.definition.strikethrough.markdown',

  // markdown block markers
  blockquote_marker: 'markup.quote.markdown',
  code_fence: 'punctuation.definition.markdown',
  front_matter_marker: 'punctuation.definition',
  heading_marker: 'markup.heading.markdown',
  hr: 'meta.separator.markdown',
  list_marker: 'punctuation.definition.list.begin.markdown',
  task_marker: undefined,

  // markdown character-level
  escape: 'constant.character.escape',
  hard_break: undefined,

  // svelte
  expression: 'punctuation.section.embedded.begin',
  svelte_block: 'keyword.control',
  svelte_directive: 'keyword.control.svelte',

  // shell sessions
  output: 'meta.output',
  prompt: 'punctuation.separator.prompt',
  prompt_prefix: 'entity.other.prompt-prefix',

  // whitespace — never colored
  carriage_return: undefined,
  newline: undefined,
  space: undefined,
  tab: undefined,

  // raw containers (reclassifier placeholders) — fall back to default text
  raw_code_block: 'markup.fenced_code.block.markdown',
  raw_front_matter: undefined,
  raw_json: undefined,
  raw_markup: undefined,
  raw_script: undefined,
  raw_shell: undefined,
  raw_style: undefined,
  raw_svelte_expression: undefined,

  // language-unique
  string_escape: 'constant.character.escape',
  format: 'storage.type.format',
  attr_sigil: 'punctuation.definition.attribute.rust',
  bit: 'string.quoted.single',
  array_table_header: 'punctuation.definition.section',
  datetime: 'constant.other.date',
  block_scalar_header: 'keyword.control.flow.block-scalar',
  directive: 'comment',
  doc_marker: 'entity.other.document',
  plain_scalar: undefined,
  tag: 'storage.type.tag-handle',
  null: 'constant.language.null',
}

export function getTokenScope(type: string): string | undefined {
  return isTokenType(type) ? tokenScopes[type] : undefined
}

function isTokenType(type: string): type is TokenType {
  return Object.hasOwn(tokenScopes, type)
}

type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes]
