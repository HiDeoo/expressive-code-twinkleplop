import { isInlineStyleAnnotation } from '@expressive-code/core'
import { assert, describe, expect, test } from 'vitest'

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

describe('embedded languages', () => {
  test('embeds all configured languages', async () => {
    const { engine } = makeEngine({
      languages: {
        md: { embed: (languages) => assertEmbeddedLanguage(languages, 'typescript') },
        ts: tokenizer,
        typescript: 'ts',
      },
    })

    const result = await render(engine, { lang: 'md' })

    expect(isHighlighted(result)).toBe(true)
  })

  test('embeds the embedding language itself', async () => {
    const { engine } = makeEngine({
      languages: {
        md: {
          embed: (languages) => {
            const md = assertEmbeddedLanguage(languages, 'md')
            return (code) => (code === 'nested' ? tokenizer(code) : md('nested'))
          },
        },
      },
    })

    const result = await render(engine, { code: 'parent', lang: 'md' })

    expect(isHighlighted(result)).toBe(true)
  })

  test('throws when an embedding language does not return a tokenizer', () => {
    expect(() =>
      // @ts-expect-error - testing an embedding language returning an invalid tokenizer
      pluginTwinkleplop({ languages: { md: { embed: () => 'invalid' } } }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [UserError: The language \`md\` is not configured correctly.

      Hint: Set it to the result of calling the \`tokenize\` export from a Twinkleplop language package or to the name of another language in the \`languages\` option. A language embedding other languages can also be set to an object with an \`embed\` function returning the result of calling a \`tokenize\` export.
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

function assertEmbeddedLanguage<T>(languages: Record<string, T>, name: string): T {
  const language = languages[name]
  assert.isDefined(language, `The embedded language \`${name}\` is not available.`)
  return language
}
