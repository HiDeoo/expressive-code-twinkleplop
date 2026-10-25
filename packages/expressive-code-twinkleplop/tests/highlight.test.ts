import { isInlineStyleAnnotation } from '@expressive-code/core'
import { expect, test } from 'vitest'

import { makeEngine, render, type RenderResult } from './utils'

const cases: HighlightCase[] = [
  {
    name: 'a token on a single line',
    code: 'a b',
    tokens: [['keyword', 2, 3]],
    ranges: [[[2, 3]]],
  },
  {
    name: 'a token spanning multiple lines',
    code: '/* a\nb */',
    tokens: [['comment', 0, 9]],
    ranges: [[[0, 4]], [[0, 4]]],
  },
  {
    name: 'a token starting on a line break',
    code: 'a\n b',
    tokens: [['comment', 1, 4]],
    ranges: [[], [[0, 2]]],
  },
  {
    name: 'a token ending with a line break',
    code: '// a\nb',
    tokens: [['comment', 0, 5]],
    ranges: [[[0, 4]], []],
  },
  {
    name: 'a token spanning an empty line',
    code: '/*\n\n*/',
    tokens: [['comment', 0, 6]],
    ranges: [[[0, 2]], [], [[0, 2]]],
  },
  {
    name: 'multiple tokens on multiple lines',
    code: 'a b\nc',
    tokens: [
      ['keyword', 0, 1],
      ['keyword', 2, 3],
      ['keyword', 4, 5],
    ],
    ranges: [
      [
        [0, 1],
        [2, 3],
      ],
      [[0, 1]],
    ],
  },
]

test.for(cases)('highlights $name', async ({ code, ranges, tokens }) => {
  const { engine } = makeEngine({ languages: { test: makeTokenizer(tokens) } })

  const result = await render(engine, { code, lang: 'test' })

  expect(getHighlightedRanges(result)).toEqual(ranges)
})

function makeTokenizer(tokens: Token[]) {
  const types = [...new Set(tokens.map(([type]) => type))]

  return () => ({
    tokens: new Uint32Array(tokens.flatMap(([type, start, end]) => [types.indexOf(type), start, end])),
    token_types: types,
  })
}

function getHighlightedRanges({ renderedGroupContents }: RenderResult) {
  return (
    renderedGroupContents[0]?.codeBlock
      .getLines()
      .map((line) =>
        line
          .getAnnotations()
          .flatMap((annotation) =>
            isInlineStyleAnnotation(annotation) && annotation.styleVariantIndex === 0 && annotation.inlineRange
              ? [[annotation.inlineRange.columnStart, annotation.inlineRange.columnEnd]]
              : [],
          ),
      ) ?? []
  )
}

type Token = [type: string, start: number, end: number]

interface HighlightCase {
  name: string
  code: string
  tokens: Token[]
  ranges: number[][][]
}
