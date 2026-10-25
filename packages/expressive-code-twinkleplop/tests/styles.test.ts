import { ExpressiveCodeTheme } from '@expressive-code/core'
import { expect, test } from 'vitest'

import { getTokenStyle } from '../src/libs/styles'

const cases: StyleCase[] = [
  {
    name: 'uses the most specific selector whatever the rule order',
    rules: [
      { scope: 'entity.name.function', settings: { foreground: '#aaaaaa' } },
      { scope: 'entity', settings: { foreground: '#bbbbbb' } },
    ],
    scope: 'entity.name.function.decorator',
    expected: { color: '#aaaaaa', fontStyle: undefined },
  },
  {
    name: 'does not match partial selectors',
    rules: [{ scope: 'entity.name.func', settings: { foreground: '#aaaaaa' } }],
    scope: 'entity.name.function',
    expected: { color: undefined, fontStyle: undefined },
  },
  {
    name: 'resolves the color and the font style independently',
    rules: [
      { scope: 'comment', settings: { foreground: '#aaaaaa' } },
      { scope: 'comment.line', settings: { fontStyle: 'italic' } },
    ],
    scope: 'comment.line',
    expected: { color: '#aaaaaa', fontStyle: 'italic' },
  },
  {
    name: 'does not style scopes without a matching selector',
    rules: [{ scope: 'keyword', settings: { foreground: '#aaaaaa' } }],
    scope: 'string',
    expected: { color: undefined, fontStyle: undefined },
  },
]

test.for(cases)('$name', ({ expected, rules, scope }) => {
  const theme = new ExpressiveCodeTheme({ tokenColors: rules })

  expect(getTokenStyle(theme, scope)).toEqual(expected)
})

interface StyleCase {
  name: string
  rules: {
    scope: string
    settings: { foreground?: string; fontStyle?: string }
  }[]
  scope: string
  expected: ReturnType<typeof getTokenStyle>
}
