/**
 * MDX grammar extending the Markdown grammar with ESM (`import` and `export` statements), expressions, and JSX tags.
 *
 * ESM blocks and expressions are emitted as raw tokens and tokenized by the TSX tokenizer while JSX children are
 * treated as Markdown content.
 *
 * @see https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/languages/markdown/src/grammar.ts
 * @see https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/languages/tsx/src/grammar.ts
 * @see https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/languages/svelte/src/grammar.ts
 */

import { DIGIT, LETTER, enter, fallback, goto, leave, match, on, within } from '@twinkleplop/core'
import { define_grammar, type GrammarRule, type GrammarState } from '@twinkleplop/core/compile'
import * as tokenTypes from '@twinkleplop/core/tokens'
import { raw_grammar as markdownGrammar } from '@twinkleplop/markdown'

import { getExpressionStates } from '../../libs/expressions'

// Token types specific to MDX.
export const MdxTokenTypes = {
  component: 'mdx_component',
  rawEsm: 'raw_mdx_esm',
  rawExpression: 'raw_mdx_expression',
} as const

// Markdown states except for indented code blocks.
const { indented_code, ...markdownStates } = markdownGrammar.states

// Valid characters for JSX tag and attribute names.
const jsxNameChars = [LETTER, DIGIT, '-', '_', '$']

// Valid characters for whitespace in JSX tags including line breaks to support tags spanning multiple lines.
const jsxWhitespaceChars = [' ', '\t', '\n', '\r']

// MDX inline rules prepended to Markdown inline rules.
const mdxInlineRules: GrammarRule[] = [
  // MDX expressions.
  match('{', tokenTypes.expression, enter('expression_body')),
  // MDX JSX tags (overrides Markdown autolinks).
  on('<', enter('jsx_probe')),
]

// Markdown `block_start` rules except for indented code blocks.
const markdownBlockStartRules = getMarkdownRules('block_start').filter((rule) => rule.state !== 'indented_code')

export const mdxRawGrammar = define_grammar({
  name: 'mdx',
  states: {
    // Inherit Markdown states.
    ...markdownStates,

    // Override Markdown `block_start` entered at the beginning of every line.
    block_start: {
      rules: [
        // MDX ESM at the beginning of a line.
        on(['import', 'export'], enter('esm_probe')),
        // ESM cannot start after leading whitespaces or blockquote markers.
        on([' ', '\t'], goto('block_start_without_esm')),
        match('>', tokenTypes.blockquote_marker, goto('block_start_without_esm')),
        // Then add back all Markdown rules except for indented code blocks.
        ...markdownBlockStartRules,
      ],
    },

    block_start_without_esm: {
      rules: [
        // A blank line ends a paragraph so ESM can start on the next line.
        on(['\n', '\r'], goto('block_start')),
        // Otherwise, continue with the block start rules.
        ...markdownBlockStartRules,
      ],
    },

    inline_content: {
      rules: [
        // A paragraph may continue on the next line but cannot be interrupted by ESM.
        match('\n', tokenTypes.newline, goto('block_start_without_esm')),
        // Otherwise, continue with inline content rules.
        ...mdxInlineRules,
        ...getMarkdownRules('inline_content'),
      ],
    },

    // Prepend MDX inline rules before Markdown inline rules (skip `code_body` where they don't apply).
    heading_body: withMdxInlineRules('heading_body'),
    bold_star_body: withMdxInlineRules('bold_star_body'),
    bold_under_body: withMdxInlineRules('bold_under_body'),
    italic_star_body: withMdxInlineRules('italic_star_body'),
    italic_under_body: withMdxInlineRules('italic_under_body'),
    strike_body: withMdxInlineRules('strike_body'),
    link_text: withMdxInlineRules('link_text'),

    esm_probe: {
      mode: 'probe',
      fallback: 'inline_content',
      rules: [
        // Make sure `import` and `export` are followed by a space and not part of a larger word.
        on(' ', goto('esm_body')),
        // Otherwise, fallback to inline content.
        fallback(goto('inline_content')),
      ],
    },

    esm_body: {
      rules: [
        // Keep the line break as part of the ESM block and move to the next line to decide if it's a multi-line ESM
        // block or the end of the block.
        match('\n', MdxTokenTypes.rawEsm, goto('esm_line_start')),
        // Otherwise, consume as part of the ESM block.
        fallback({ token: MdxTokenTypes.rawEsm }),
      ],
    },

    esm_line_start: {
      rules: [
        // On a blank line, end the ESM block.
        on(['\n', '\r'], goto('block_start')),
        // Consume leading whitespaces as part of the ESM block to ensure whitespace-only lines end the block correctly.
        match([' ', '\t'], MdxTokenTypes.rawEsm),
        // Otherwise, continue with the ESM body.
        fallback(goto('esm_body')),
      ],
    },

    jsx_probe: {
      mode: 'probe',
      fallback: 'jsx_lt_text',
      rules: [
        // Detect if the `<` starts a valid JSX tag.
        on([LETTER, '_', '$', '/', '>'], enter('jsx_tag_start')),
        // Handle `<<`.
        on('<', enter('jsx_lt_text_before_lt')),
        // Otherwise, fallback to consuming as text.
        fallback(enter('jsx_lt_text')),
      ],
    },

    jsx_lt_text: {
      rules: [
        // Consume the `<` as tokenless text.
        on('<'),
        // Otherwise, go back to Markdown.
        fallback(leave()),
      ],
    },

    jsx_lt_text_before_lt: {
      // Match the first `<` as punctuation as a tokenless pop cannot consume.
      // https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/languages/svelte/src/grammar.ts#L225-L228
      rules: [match('<', tokenTypes.punctuation, leave())],
    },

    jsx_tag_start: {
      rules: [
        // A JSX closing tag followed by its name, or the closing of a fragment.
        match('</', tokenTypes.punctuation, goto('jsx_close_name')),
        // A JSX opening fragment tag with Markdown children.
        match('<>', tokenTypes.punctuation, leave()),
        // A JSX opening tag followed by its name.
        match('<', tokenTypes.punctuation, goto('jsx_tag_name')),
      ],
    },

    jsx_tag_name: {
      rules: [
        // Opening tag name.
        match(jsxNameChars, tokenTypes.tag_name),
        // Compound component.
        match('.', tokenTypes.punctuation),
        // End of the opening tag name.
        match('/>', tokenTypes.punctuation, leave()),
        match('>', tokenTypes.punctuation, leave()),
        // Otherwise, move on to attributes.
        fallback(goto('jsx_tag_attrs')),
      ],
    },

    jsx_tag_attrs: {
      rules: [
        // Consume whitespaces.
        on(jsxWhitespaceChars),
        // End of the opening tag.
        match('/>', tokenTypes.punctuation, leave()),
        match('>', tokenTypes.punctuation, leave()),
        // Attribute assignment.
        match('=', tokenTypes.operator),
        // Attribute expression value.
        match('{', tokenTypes.expression, enter('expression_body')),
        // Attribute string value.
        within('"', '"', tokenTypes.string, { multiline: true }),
        within("'", "'", tokenTypes.string, { multiline: true }),
        // Attribute name.
        match(jsxNameChars, tokenTypes.attr_name),
        // Namespaced attribute, e.g. Astro directives.
        match(':', tokenTypes.punctuation),
        // Otherwise, go back to Markdown.
        fallback(leave()),
      ],
    },

    jsx_close_name: {
      rules: [
        // Consume whitespaces.
        on(jsxWhitespaceChars),
        // Closing tag name.
        match(jsxNameChars, tokenTypes.tag_name),
        // Compound component.
        match('.', tokenTypes.punctuation),
        // End of the closing tag.
        match('>', tokenTypes.punctuation, leave()),
        // Otherwise, go back to Markdown.
        fallback(leave()),
      ],
    },

    ...getExpressionStates(MdxTokenTypes.rawExpression),
  },
})

function withMdxInlineRules(name: string): GrammarState {
  return { rules: [...mdxInlineRules, ...getMarkdownRules(name)] }
}

function getMarkdownRules(name: string): GrammarRule[] {
  const rules = markdownGrammar.states[name]?.rules
  if (!rules) throw new Error(`Failed to get rules for Markdown state \`${name}\`.`)
  return rules
}

export type MdxTokenType = (typeof MdxTokenTypes)[keyof typeof MdxTokenTypes]
