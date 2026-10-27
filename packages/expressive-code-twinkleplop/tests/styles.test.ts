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
    scopes: ['entity.name.function.decorator'],
    expected: { color: '#aaaaaa', fontStyle: undefined },
  },
  {
    name: 'does not match partial selectors',
    rules: [{ scope: 'entity.name.func', settings: { foreground: '#aaaaaa' } }],
    scopes: ['entity.name.function'],
    expected: { color: undefined, fontStyle: undefined },
  },
  {
    name: 'resolves the color and the font style independently',
    rules: [
      { scope: 'comment', settings: { foreground: '#aaaaaa' } },
      { scope: 'comment.line', settings: { fontStyle: 'italic' } },
    ],
    scopes: ['comment.line'],
    expected: { color: '#aaaaaa', fontStyle: 'italic' },
  },
  {
    name: 'does not style scopes without a matching selector',
    rules: [{ scope: 'keyword', settings: { foreground: '#aaaaaa' } }],
    scopes: ['string'],
    expected: { color: undefined, fontStyle: undefined },
  },
  {
    name: 'preserves the outer font style when an inner scope only defines a color',
    rules: [
      { scope: 'markup.bold', settings: { fontStyle: 'bold' } },
      { scope: 'entity.name.tag', settings: { foreground: '#aaaaaa' } },
    ],
    scopes: ['markup.bold.markdown', 'entity.name.tag'],
    expected: { color: '#aaaaaa', fontStyle: 'bold' },
  },
  {
    name: 'overrides the outer font style with the inner one',
    rules: [
      { scope: 'markup.bold', settings: { fontStyle: 'bold' } },
      { scope: 'markup.italic', settings: { fontStyle: 'italic' } },
    ],
    scopes: ['markup.bold.markdown', 'markup.italic.markdown'],
    expected: { color: undefined, fontStyle: 'italic' },
  },
  {
    name: 'preserves the outer color when an inner scope is not styled',
    rules: [{ scope: 'markup.bold', settings: { foreground: '#aaaaaa' } }],
    scopes: ['markup.bold.markdown', 'variable.other.readwrite'],
    expected: { color: '#aaaaaa', fontStyle: undefined },
  },
]

test.for(cases)('$name', ({ expected, rules, scopes }) => {
  const theme = new ExpressiveCodeTheme({ tokenColors: rules })

  expect(getTokenStyle(theme, scopes)).toEqual(expected)
})

interface StyleCase {
  name: string
  rules: {
    scope: string
    settings: { foreground?: string; fontStyle?: string }
  }[]
  scopes: string[]
  expected: ReturnType<typeof getTokenStyle>
}
