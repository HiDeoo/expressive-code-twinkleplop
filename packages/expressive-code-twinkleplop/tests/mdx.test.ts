import type { LanguageFn } from '@twinkleplop/core'
import { verify } from '@twinkleplop/core/compile'
import { tokenize as tsx } from '@twinkleplop/tsx'
import { tokenize as yaml } from '@twinkleplop/yaml'
import { describe, expect, test } from 'vitest'

import { tokenize } from '../src/languages/mdx'
import { mdxRawGrammar } from '../src/languages/mdx/grammar'

const mdx = tokenize()
const script = tsx()

test('defines a valid grammar', () => {
  expect(verify(mdxRawGrammar)).toEqual([])
})

describe('ESM', () => {
  const cases: TokenizeCase[] = [
    {
      name: 'imports',
      code: "import { A } from 'a'\nimport b from 'b'\n\nText",
      tokens: getTokens(script, "import { A } from 'a'\nimport b from 'b'\n"),
    },
    { name: 'a word starting with an ESM keyword', code: 'important', tokens: [] },
    {
      name: 'a paragraph continuing with a word starting with an ESM keyword',
      code: 'Make sure to\nimport something.',
      tokens: [],
    },
    { name: 'an indented line starting with an ESM keyword', code: '  import something', tokens: [] },
    {
      name: 'a blockquote starting with an ESM keyword',
      code: '> import something',
      tokens: [['blockquote_marker', '>']],
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(mdx, code)).toEqual(tokens)
  })
})

describe('expressions', () => {
  const cases: TokenizeCase[] = [
    { name: 'an expression', code: '{foo}', tokens: getExpressionTokens('foo') },
    { name: 'nested braces', code: "{{ foo: 'bar' }}", tokens: getExpressionTokens("{ foo: 'bar' }") },
    {
      name: 'a comment',
      code: "{/* dont't update this code */}",
      tokens: getExpressionTokens("/* dont't update this code */"),
    },
    { name: 'an escaped character', code: String.raw`{'Don\'t'}`, tokens: getExpressionTokens(String.raw`'Don\'t'`) },
    // eslint-disable-next-line no-template-curly-in-string
    { name: 'a template literal', code: '{`Hello ${name}`}', tokens: getExpressionTokens('`Hello ${name}`') },
    {
      name: 'braces in a template literal',
      code: "<style>{`body { font-family: 'Inter' }`}</style>",
      tokens: [
        ['punctuation', '<'],
        ['tag_name', 'style'],
        ['punctuation', '>'],
        ...getExpressionTokens("`body { font-family: 'Inter' }`"),
        ['punctuation', '</'],
        ['tag_name', 'style'],
        ['punctuation', '>'],
      ],
    },
    {
      name: 'an expression inside Markdown syntax',
      code: '**{x}**',
      tokens: [
        ['bold', '**'],
        ...getExpressionTokens('x').map(([type, text]): Token => [`bold ${type}`, text]),
        ['bold', '**'],
      ],
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(mdx, code)).toEqual(tokens)
  })
})

describe('JSX', () => {
  const cases: TokenizeCase[] = [
    {
      name: 'attributes',
      code: `<Card title="Hello" icon='star' size={1} {...props}>`,
      tokens: [
        ['punctuation', '<'],
        ['mdx_component', 'Card'],
        ['attr_name', 'title'],
        ['operator', '='],
        ['string', '"Hello"'],
        ['attr_name', 'icon'],
        ['operator', '='],
        ['string', "'star'"],
        ['attr_name', 'size'],
        ['operator', '='],
        ...getExpressionTokens('1'),
        ...getExpressionTokens('...props'),
        ['punctuation', '>'],
      ],
    },
    {
      name: 'a tag spanning multiple lines',
      code: '<Card\n  title="Hello"\n>\nText',
      tokens: [
        ['punctuation', '<'],
        ['mdx_component', 'Card'],
        ['attr_name', 'title'],
        ['operator', '='],
        ['string', '"Hello"'],
        ['punctuation', '>'],
      ],
    },
    {
      name: 'a closing tag',
      code: '</Card>',
      tokens: [
        ['punctuation', '</'],
        ['mdx_component', 'Card'],
        ['punctuation', '>'],
      ],
    },
    {
      name: 'a fragment',
      code: '<>Hello</>',
      tokens: [
        ['punctuation', '<>'],
        ['punctuation', '</>'],
      ],
    },
    {
      name: 'a compound component',
      code: '<Tabs.Item>',
      tokens: [
        ['punctuation', '<'],
        ['mdx_component', 'Tabs'],
        ['punctuation', '.'],
        ['mdx_component', 'Item'],
        ['punctuation', '>'],
      ],
    },
    {
      name: 'an HTML element',
      code: '<span>',
      tokens: [
        ['punctuation', '<'],
        ['tag_name', 'span'],
        ['punctuation', '>'],
      ],
    },
    { name: 'a less-than sign in text', code: 'a < b', tokens: [] },
    {
      name: 'indented children',
      code: '<Card>\n    Text\n</Card>',
      tokens: [
        ['punctuation', '<'],
        ['mdx_component', 'Card'],
        ['punctuation', '>'],
        ['punctuation', '</'],
        ['mdx_component', 'Card'],
        ['punctuation', '>'],
      ],
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(mdx, code)).toEqual(tokens)
  })
})

describe('Markdown', () => {
  test('embeds YAML frontmatter', () => {
    expect(getTokens(mdx, '---\ntitle: Foo\n---\n')).toEqual([
      ['front_matter_marker', '---\n'],
      ...getTokens(yaml(), 'title: Foo'),
      ['front_matter_marker', '\n---\n'],
    ])
  })

  test('does not embed fenced code blocks with unconfigured languages', () => {
    expect(getTokens(tokenize({ languages: { ts: script } }), "```js\nconst foo = 'bar'\n```")).toEqual([
      ['code_fence', '```'],
      ['code_language', 'js'],
      ['raw_code_block', "\nconst foo = 'bar'\n"],
      ['code_fence', '```'],
    ])
  })

  test('embeds fenced code blocks with configured languages', () => {
    expect(getTokens(tokenize({ languages: { ts: script } }), "```ts\nconst foo = 'bar'\n```")).toEqual([
      ['code_fence', '```'],
      ['code_language', 'ts'],
      ...getTokens(script, "\nconst foo = 'bar'\n"),
      ['code_fence', '```'],
    ])
  })
})

function getTokens(tokenizer: LanguageFn, code: string): Token[] {
  const { tokens, token_types } = tokenizer(code)
  const result: Token[] = []

  for (let index = 0; index < tokens.length; index += 3) {
    const [type = 0, start = 0, end = 0] = tokens.subarray(index, index + 3)
    const name = token_types[type] ?? ''
    // Skip newline tokens which are not highlighted.
    if (name !== 'newline') result.push([name, code.slice(start, end)])
  }

  return result
}

function getExpressionTokens(code: string): Token[] {
  return [['expression', '{'], ...getTokens(script, code), ['expression', '}']]
}

type Token = [type: string, text: string]

interface TokenizeCase {
  name: string
  code: string
  tokens: Token[]
}
