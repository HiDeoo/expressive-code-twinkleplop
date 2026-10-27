/**
 * Astro grammar extending the HTML grammar with frontmatter, expressions, components, fragments, and template literals
 * attributes.
 *
 * The frontmatter, expressions, and template literal attributes are emitted as raw tokens and tokenized by the TSX
 * tokenizer while scripts and styles are emitted as raw tokens inherited from the HTML grammar.
 *
 * @see https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/languages/html/src/grammar.ts
 * @see https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/languages/tsx/src/grammar.ts
 * @see https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/languages/svelte/src/grammar.ts
 */

import { DIGIT, LETTER, enter, fallback, goto, leave, match, on, within } from '@twinkleplop/core'
import { define_grammar, type GrammarRule } from '@twinkleplop/core/compile'
import * as tokenTypes from '@twinkleplop/core/tokens'
import { raw_grammar as htmlGrammar } from '@twinkleplop/html'

import { getExpressionStates } from '../../libs/expressions'

// Token types specific to Astro.
export const AstroTokenTypes = {
  component: 'astro_component',
  rawExpression: 'raw_astro_expression',
  rawFrontmatter: 'raw_astro_frontmatter',
} as const

// Valid characters for tag and attribute names.
const nameChars = [LETTER, DIGIT, '-', '_', '$']

// Valid characters for whitespace in tags including line breaks to support tags spanning multiple lines.
const whitespaceChars = [' ', '\t', '\n', '\r']

// Attribute rules for opening tags.
const attributeRules: GrammarRule[] = [
  // Consume whitespaces.
  on(whitespaceChars),
  // Attribute assignment.
  match('=', tokenTypes.operator),
  // Attribute expression value, shorthand attribute, or spread attributes.
  match('{', tokenTypes.expression, enter('expression_body')),
  // Attribute string value.
  within('"', '"', tokenTypes.string, { multiline: true }),
  within("'", "'", tokenTypes.string, { multiline: true }),
  // Attribute template literal value.
  match('`', AstroTokenTypes.rawExpression, enter('expression_template_literal')),
  // Attribute name.
  match(nameChars, tokenTypes.attr_name),
  // Namespaced attribute, e.g. Astro directives.
  match(':', tokenTypes.punctuation),
]

export const astroRawGrammar = define_grammar({
  name: 'astro',
  states: {
    main: {
      rules: [
        // The opening frontmatter marker.
        match('---', tokenTypes.front_matter_marker, goto('frontmatter_body')),
        // Otherwise, continue with the content.
        fallback(goto('content')),
      ],
    },

    frontmatter_body: {
      rules: [
        // End of the frontmatter.
        match('\n---', tokenTypes.front_matter_marker, goto('content')),
        // Otherwise, consume as part of the frontmatter.
        fallback({ token: AstroTokenTypes.rawFrontmatter }),
      ],
    },

    // Inherit HTML states.
    ...htmlGrammar.states,

    content: {
      rules: [
        // Astro expressions.
        match('{', tokenTypes.expression, enter('expression_body')),
        // Astro fragments.
        match(['<>', '</>'], tokenTypes.punctuation),
        // Then add back all HTML rules.
        ...getHtmlRules('content'),
      ],
    },

    tag_open: {
      rules: [
        // Opening tag name.
        match(nameChars, tokenTypes.tag_name),
        // Compound component.
        match('.', tokenTypes.punctuation),
        // End of the opening tag name.
        match('/>', tokenTypes.punctuation, leave()),
        match('>', tokenTypes.punctuation, leave()),
        // Otherwise, move on to attributes.
        fallback(goto('tag_attrs')),
      ],
    },

    tag_attrs: {
      rules: [
        ...attributeRules,
        // End of the opening tag.
        match('/>', tokenTypes.punctuation, leave()),
        match('>', tokenTypes.punctuation, leave()),
        // Otherwise, go back to the content.
        fallback(leave()),
      ],
    },

    close_tag: {
      rules: [
        // Consume whitespaces.
        on(whitespaceChars),
        // Closing tag name.
        match(nameChars, tokenTypes.tag_name),
        // Compound component.
        match('.', tokenTypes.punctuation),
        // End of the closing tag.
        match('>', tokenTypes.punctuation, leave()),
        // Otherwise, go back to the content.
        fallback(leave()),
      ],
    },

    script_attrs: {
      rules: [
        ...attributeRules,
        // End of opening script tag.
        match('/>', tokenTypes.punctuation, leave()),
        match('>', tokenTypes.punctuation, goto('script_content')),
      ],
    },

    style_attrs: {
      rules: [
        ...attributeRules,
        // End of opening style tag.
        match('/>', tokenTypes.punctuation, leave()),
        match('>', tokenTypes.punctuation, goto('style_content')),
      ],
    },

    ...getExpressionStates(AstroTokenTypes.rawExpression),
  },
})

function getHtmlRules(name: string): GrammarRule[] {
  const rules = htmlGrammar.states[name]?.rules
  if (!rules) throw new Error(`Failed to get rules for HTML state \`${name}\`.`)
  return rules
}

export type AstroTokenType = (typeof AstroTokenTypes)[keyof typeof AstroTokenTypes]
