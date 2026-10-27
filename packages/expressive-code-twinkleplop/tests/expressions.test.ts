import { enter, fallback, match, tokenize as tokenizeGrammar } from '@twinkleplop/core'
import { compile, define_grammar, verify } from '@twinkleplop/core/compile'
import * as tokenTypes from '@twinkleplop/core/tokens'
import { describe, expect, test } from 'vitest'

import { getExpressionStates } from '../src/libs/expressions'

import { getTokens, type Token, type TokenizeCase } from './utils'

const rawGrammar = define_grammar({
  name: 'test',
  states: {
    main: {
      rules: [match('{', tokenTypes.expression, enter('expression_body')), fallback({})],
    },
    ...getExpressionStates('raw_expression'),
  },
})

const grammar = compile(rawGrammar)

test('defines a valid grammar', () => {
  expect(verify(rawGrammar)).toEqual([])
})

describe('content', () => {
  const cases: TokenizeCase[] = [
    { name: 'nested braces', code: "{{ foo: 'bar' }} after", tokens: getRawExpressionTokens("{ foo: 'bar' }") },
    {
      name: 'a comment',
      code: "{/* Let's go */} after",
      tokens: getRawExpressionTokens("/* Let's go */"),
    },
    {
      name: 'an escaped character',
      code: String.raw`{'Let\'s go'} after`,
      tokens: getRawExpressionTokens(String.raw`'Let\'s go'`),
    },
    {
      name: 'a template literal',
      // eslint-disable-next-line no-template-curly-in-string
      code: '{`Hello ${name}`} after',
      // eslint-disable-next-line no-template-curly-in-string
      tokens: getRawExpressionTokens('`Hello ${name}`'),
    },
    {
      name: 'braces in a template literal',
      code: "{`body { font-family: 'Inter' }`} after",
      tokens: getRawExpressionTokens("`body { font-family: 'Inter' }`"),
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(tokenize, code)).toEqual(tokens)
  })
})

describe('JSX', () => {
  const cases: TokenizeCase[] = [
    {
      name: 'text with an apostrophe',
      code: "{names.map((name) => <li>Let's go {name}</li>)} after",
      tokens: getRawExpressionTokens("names.map((name) => <li>Let's go {name}</li>)"),
    },
    {
      name: 'text with a URL',
      code: '{<p>See https://example.com</p>} after',
      tokens: getRawExpressionTokens('<p>See https://example.com</p>'),
    },
    {
      name: 'nested elements',
      code: "{<ul><li>Let's go</li></ul>} after",
      tokens: getRawExpressionTokens("<ul><li>Let's go</li></ul>"),
    },
    {
      name: 'a fragment and a self-closing element',
      code: '{condition && <><Icon /></>} after',
      tokens: getRawExpressionTokens('condition && <><Icon /></>'),
    },
    {
      name: 'attributes',
      code: `{<Card icon={<Icon />} title="Let's go" />} after`,
      tokens: getRawExpressionTokens(`<Card icon={<Icon />} title="Let's go" />`),
    },
    {
      name: 'a less-than sign in text',
      code: "{<p>a < b, but let's go</p>} after",
      tokens: getRawExpressionTokens("<p>a < b, but let's go</p>"),
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(tokenize, code)).toEqual(tokens)
  })
})

describe('less-than operators', () => {
  const cases: TokenizeCase[] = [
    {
      name: 'a less-than operator',
      code: "{a < b ? 'a' : 'b'} after",
      tokens: getRawExpressionTokens("a < b ? 'a' : 'b'"),
    },
    { name: 'a left shift operator', code: '{a << b} after', tokens: getRawExpressionTokens('a << b') },
    {
      name: 'a less-than operator mistaken for a tag',
      code: "{i<count ? 'a' : 'b'} after",
      tokens: getRawExpressionTokens("i<count ? 'a' : 'b'"),
    },
    {
      name: 'a less-than operator mistaken for a self-closing tag',
      code: '{a<b/2} after',
      tokens: getRawExpressionTokens('a<b/2'),
    },
    {
      name: 'a less-than operator mistaken for a tag with children',
      code: '{a<b && c>d} after',
      tokens: getRawExpressionTokens('a<b && c>d'),
    },
  ]

  test.for(cases)('tokenizes $name', ({ code, tokens }) => {
    expect(getTokens(tokenize, code)).toEqual(tokens)
  })
})

function tokenize(code: string) {
  return tokenizeGrammar(code, grammar)
}

function getRawExpressionTokens(code: string): Token[] {
  return [
    ['expression', '{'],
    ['raw_expression', code],
    ['expression', '}'],
  ]
}
