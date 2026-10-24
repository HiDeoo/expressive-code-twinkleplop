import { isInlineStyleAnnotation } from '@expressive-code/core'
import { describe, expect, test } from 'vitest'

import { pluginTwinkleplop } from '../src'

import { makeEngine, render, type RenderResult } from './utils'

describe('languages aliases', () => {
  test('resolves language aliases', async () => {
    const { engine, logger } = makeEngine({ languages: { mts: 'typescript', ts: tokenizer, typescript: 'ts' } })

    const result = await render(engine, { lang: 'mts' })

    expect(isHighlighted(result)).toBe(true)
    expect(logger.warn).not.toHaveBeenCalled()
  })

  test('throws on cyclic language aliases', () => {
    expect(() => pluginTwinkleplop({ languages: { mts: 'ts', ts: 'ts' } })).toThrowErrorMatchingInlineSnapshot(`
      [UserError: The language \`ts\` is an alias that refers back to itself: \`ts\` → \`ts\`.

      Hint: Make sure each alias in the \`languages\` option eventually refers to a language that is not an alias.
      ]
    `)
  })

  test('throws on unknown language aliases', () => {
    expect(() => pluginTwinkleplop({ languages: { mts: 'typescript', typescript: 'tsx' } }))
      .toThrowErrorMatchingInlineSnapshot(`
      [UserError: The language \`typescript\` is an alias of \`tsx\`, which is not configured.

      Hint: Add \`tsx\` to the \`languages\` option or change the alias to refer to a configured language.
      ]
    `)
  })
})

describe('unknown languages', () => {
  test('warns once per language and document', async () => {
    const { engine, logger } = makeEngine({ languages: { ts: tokenizer } })

    await render(engine, { lang: 'js', sourceFilePath: '/a.md' })
    await render(engine, { lang: 'js', sourceFilePath: '/a.md' })

    await render(engine, { lang: 'js', sourceFilePath: '/b.md' })

    await render(engine, { lang: 'py', sourceFilePath: '/a.md' })

    expect(logger.warn).toHaveBeenCalledTimes(3)
  })

  test('throws when `onUnknownLanguage` is set to `throw`', async () => {
    const { engine } = makeEngine({ languages: { ts: tokenizer }, onUnknownLanguage: 'throw' })

    await expect(render(engine, { lang: 'js' })).rejects.toThrowErrorMatchingInlineSnapshot(`
      [Error: Plugin "Twinkleplop" caused an error in its "performSyntaxAnalysis" hook. Error message: The language \`js\` used in \`/index.md\` is not configured.

      Hint: Add it to the \`languages\` option or set the \`onUnknownLanguage\` option to \`'plain'\` to render code in unknown languages without any syntax highlighting.
      ]
    `)
  })
})

describe('invalid tokenizers', () => {
  test.for([
    ['the `tokenize` export without calling it', () => tokenizer],
    ['an invalid tokenizer', () => true],
  ])('throws when a language is set to %s', async ([, value]) => {
    // @ts-expect-error - testing an invalid tokenizer
    const { engine } = makeEngine({ languages: { ts: value } })

    await expect(render(engine, { lang: 'ts' })).rejects.toThrowErrorMatchingInlineSnapshot(`
      [Error: Plugin "Twinkleplop" caused an error in its "performSyntaxAnalysis" hook. Error message: The language \`ts\` is not configured correctly.

      Hint: Set it to the result of calling the \`tokenize\` export from a Twinkleplop language package, not to the export itself or to the \`language\` export.
      ]
    `)
  })
})

function tokenizer(code: string) {
  return { tokens: new Uint32Array([0, 0, code.length]), token_types: ['keyword'] }
}

function isHighlighted({ renderedGroupContents }: RenderResult) {
  return (
    renderedGroupContents[0]?.codeBlock
      .getLines()
      .some((line) => line.getAnnotations().some((annotation) => isInlineStyleAnnotation(annotation))) ?? false
  )
}
