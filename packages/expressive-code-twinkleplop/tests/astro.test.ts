import { verify } from '@twinkleplop/core/compile'
import { tokenize as css } from '@twinkleplop/css'
import { tokenize as tsx } from '@twinkleplop/tsx'
import { describe, expect, test } from 'vitest'

import { tokenize } from '../src/languages/astro'
import { astroRawGrammar } from '../src/languages/astro/grammar'

import { getExpressionTokens, getTokens, type TokenizeCase } from './utils'

const astro = tokenize()
const script = tsx()

test('defines a valid grammar', () => {
  expect(verify(astroRawGrammar)).toEqual([])
})

describe('frontmatter', () => {
  const cases: TokenizeCase[] = [
    {
      name: 'a frontmatter',
      code: "---\nconst foo = 'bar'\n---\n<p />",
      tokens: [
        ['front_matter_marker', '---'],
        ...getTokens(script, "\nconst foo = 'bar'"),
        ['front_matter_marker', '\n---'],
        ['punctuation', '<'],
        ['tag_name', 'p'],
        ['punctuation', '/>'],
      ],
    },
    {
      name: 'a template without frontmatter',
      code: '<p>a < b</p>',
      tokens: [
        ['punctuation', '<'],
        ['tag_name', 'p'],
        ['punctuation', '>'],
        ['punctuation', '</'],
        ['tag_name', 'p'],
        ['punctuation', '>'],
      ],
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(astro, code)).toEqual(tokens)
  })
})

describe('template', () => {
  const cases: TokenizeCase[] = [
    { name: 'an expression', code: '{name}', tokens: getExpressionTokens('name') },
    {
      name: 'a component with a directive',
      code: '<Counter client:load count={1} {...props} />',
      tokens: [
        ['punctuation', '<'],
        ['astro_component', 'Counter'],
        ['attr_name', 'client'],
        ['punctuation', ':'],
        ['attr_name', 'load'],
        ['attr_name', 'count'],
        ['operator', '='],
        ...getExpressionTokens('1'),
        ...getExpressionTokens('...props'),
        ['punctuation', '/>'],
      ],
    },
    {
      name: 'a template literal attribute',
      // eslint-disable-next-line no-template-curly-in-string
      code: '<a href=`/blog/${slug}`>',
      tokens: [
        ['punctuation', '<'],
        ['tag_name', 'a'],
        ['attr_name', 'href'],
        ['operator', '='],
        // eslint-disable-next-line no-template-curly-in-string
        ...getTokens(script, '`/blog/${slug}`'),
        ['punctuation', '>'],
      ],
    },
    {
      name: 'a compound component closing tag',
      code: '</Tabs.Item>',
      tokens: [
        ['punctuation', '</'],
        ['astro_component', 'Tabs'],
        ['punctuation', '.'],
        ['astro_component', 'Item'],
        ['punctuation', '>'],
      ],
    },
    {
      name: 'a compound component',
      code: '<Astro.self />',
      tokens: [
        ['punctuation', '<'],
        ['astro_component', 'Astro'],
        ['punctuation', '.'],
        ['astro_component', 'self'],
        ['punctuation', '/>'],
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
      name: 'a script',
      code: "<script>\nconst foo = 'bar'\n</script>",
      tokens: [
        ['punctuation', '<'],
        ['tag_name', 'script'],
        ['punctuation', '>'],
        ...getTokens(script, "\nconst foo = 'bar'\n"),
        ['punctuation', '</'],
        ['tag_name', 'script'],
        ['punctuation', '>'],
      ],
    },
    {
      name: 'a script with attributes',
      code: '<script define:vars={{ slug }}>\nconsole.log(slug)\n</script>',
      tokens: [
        ['punctuation', '<'],
        ['tag_name', 'script'],
        ['attr_name', 'define'],
        ['punctuation', ':'],
        ['attr_name', 'vars'],
        ['operator', '='],
        ...getExpressionTokens('{ slug }'),
        ['punctuation', '>'],
        ...getTokens(script, '\nconsole.log(slug)\n'),
        ['punctuation', '</'],
        ['tag_name', 'script'],
        ['punctuation', '>'],
      ],
    },
    {
      name: 'a style',
      code: '<style>a { color: red; }</style>',
      tokens: [
        ['punctuation', '<'],
        ['tag_name', 'style'],
        ['punctuation', '>'],
        ...getTokens(css(), 'a { color: red; }'),
        ['punctuation', '</'],
        ['tag_name', 'style'],
        ['punctuation', '>'],
      ],
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(astro, code)).toEqual(tokens)
  })
})
