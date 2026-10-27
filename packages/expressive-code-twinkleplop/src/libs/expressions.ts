import { enter, fallback, goto, leave, LETTER, match, on } from '@twinkleplop/core'
import type { GrammarRule, GrammarState } from '@twinkleplop/core/compile'
import * as tokenTypes from '@twinkleplop/core/tokens'

// Characters following a `<` that start a JSX element or fragment.
const jsxTagStartChars = [LETTER, '_', '$', '>']

// States for an expression wrapped in braces, e.g. `{foo}`, with its content emitted as the provided raw token type so
// that it can be embedded as a whole with another tokenizer.
export function getExpressionStates(token: string): Record<string, GrammarState> {
  // Expression bodies only use single character rules so that they merge into a single token embedded as a whole.
  const expressionRules: GrammarRule[] = [
    // Nested opening brace.
    match('{', token, enter('expression_brace')),
    // String literals.
    match('"', token, enter('expression_string_double')),
    match("'", token, enter('expression_string_single')),
    // Template literals.
    match('`', token, enter('expression_template_literal')),
    // Slash to differentiate between comments and other uses of `/`.
    match('/', token, enter('expression_slash')),
    // Prevent quotes and slashes in JSX text from being mistaken for strings or comments, e.g. `<li>Don't</li>`.
    on('<', enter('expression_jsx_probe')),
    // Otherwise, consume as part of the expression.
    fallback({ token }),
  ]

  return {
    expression_body: {
      rules: [
        // The outermost closing brace of the expression.
        match('}', tokenTypes.expression, leave()),
        // Otherwise, handle the expression content.
        ...expressionRules,
      ],
    },

    expression_brace: {
      rules: [
        // Nested closing brace which is part of the expression content.
        match('}', token, leave()),
        // Otherwise, handle the expression content.
        ...expressionRules,
      ],
    },

    expression_string_double: {
      rules: [
        // Closing double quote of a string within an expression.
        match('"', token, leave()),
        // Escaped character within the string.
        match('\\', token, enter('expression_escape')),
        // Otherwise, consume as part of the expression.
        fallback({ token }),
      ],
    },

    expression_string_single: {
      rules: [
        // Closing single quote of a string within an expression.
        match("'", token, leave()),
        // Escaped character within the string.
        match('\\', token, enter('expression_escape')),
        // Otherwise, consume as part of the expression.
        fallback({ token }),
      ],
    },

    expression_template_literal: {
      rules: [
        // Closing backtick of a template literal within an expression.
        match('`', token, leave()),
        // Escaped character within the template literal.
        match('\\', token, enter('expression_escape')),
        // Possible start of a template substitution.
        match('$', token, enter('expression_template_dollar')),
        // Otherwise, consume as part of the expression.
        fallback({ token }),
      ],
    },

    expression_template_dollar: {
      rules: [
        // A substitution within a template literal.
        match('{', token, goto('expression_brace')),
        // Otherwise, treat the `$` as text.
        fallback(leave()),
      ],
    },

    expression_escape: {
      rules: [
        // Escaped characters are text, e.g. the quote in `'Don\'t'` does not end the string.
        match(['"', "'", '`', '\\', '$'], token, leave()),
        // Otherwise, go back to the string.
        fallback(leave()),
      ],
    },

    expression_slash: {
      rules: [
        // Start of a block comment.
        match('*', token, goto('expression_block_comment')),
        // Start of a line comment.
        match('/', token, goto('expression_line_comment')),
        // Otherwise, go back to the expression.
        fallback(leave()),
      ],
    },

    expression_block_comment: {
      rules: [
        // Possible end of the block comment.
        match('*', token, goto('expression_block_comment_star')),
        // Otherwise, continue consuming as part of the block comment.
        fallback({ token }),
      ],
    },

    expression_block_comment_star: {
      rules: [
        // End of the block comment.
        match('/', token, leave()),
        // Otherwise, continue processing as part of the block comment.
        fallback(goto('expression_block_comment')),
      ],
    },

    expression_line_comment: {
      rules: [
        // End of the line comment.
        match('\n', token, leave()),
        // Otherwise, consume as part of the line comment.
        fallback({ token }),
      ],
    },

    expression_jsx_probe: {
      mode: 'probe',
      fallback: 'expression_lt',
      rules: [
        // Detect if the `<` starts a JSX element or fragment.
        on(jsxTagStartChars, enter('expression_jsx_tag_start')),
        // Otherwise, fallback to a less-than operator, e.g. `a < b`.
        fallback(enter('expression_lt')),
      ],
    },

    expression_lt: {
      rules: [
        // Consume as part of the expression.
        match('<', token, leave()),
      ],
    },

    expression_jsx_tag_start: {
      rules: [
        // A JSX opening tag or fragment followed by its name and attributes, if any.
        match('<', token, goto('expression_jsx_attrs')),
      ],
    },

    expression_jsx_attrs: {
      rules: [
        // End of the opening tag followed by its children.
        match('>', token, goto('expression_jsx_children')),
        // Possible end of a self-closing JSX element.
        match('/', token, goto('expression_jsx_attrs_slash')),
        // Attribute expression value or spread attributes.
        match('{', token, enter('expression_brace')),
        // Attribute string value.
        match('"', token, enter('expression_string_double')),
        match("'", token, enter('expression_string_single')),
        // Go back to the expression after mistakenly interpreting a `<` in the expression as a JSX tag.
        on('}', leave()),
        // Otherwise, consume as part of the tag.
        fallback({ token }),
      ],
    },

    expression_jsx_attrs_slash: {
      rules: [
        // End of a self-closing JSX element.
        match('>', token, leave()),
        // Otherwise, go back to the attributes.
        fallback(goto('expression_jsx_attrs')),
      ],
    },

    expression_jsx_children: {
      rules: [
        // Possible closing tag or nested JSX element.
        on('<', enter('expression_jsx_children_probe')),
        // Nested expression.
        match('{', token, enter('expression_brace')),
        // Go back to the expression after mistakenly interpreting a `<` in the expression as a JSX tag.
        on('}', leave()),
        // Otherwise, consume as text.
        fallback({ token }),
      ],
    },

    expression_jsx_children_probe: {
      mode: 'probe',
      fallback: 'expression_lt',
      rules: [
        // Closing tag of the element or fragment.
        on('/', goto('expression_jsx_close')),
        // Nested JSX element or fragment.
        on(jsxTagStartChars, enter('expression_jsx_tag_start')),
        // Otherwise, fallback to a less-than sign in the text, e.g. `a < b`.
        fallback(enter('expression_lt')),
      ],
    },

    expression_jsx_close: {
      rules: [
        // End of the closing tag.
        match('>', token, leave()),
        // Go back to the expression after mistakenly interpreting a `<` in the expression as a JSX tag.
        on('}', leave()),
        // Otherwise, consume as part of the closing tag.
        fallback({ token }),
      ],
    },
  }
}
