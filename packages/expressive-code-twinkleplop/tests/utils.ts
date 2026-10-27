import { ExpressiveCodeEngine } from '@expressive-code/core'
import type { LanguageFn } from '@twinkleplop/core'
import { tokenize as tsx } from '@twinkleplop/tsx'
import { vi } from 'vitest'

import { pluginTwinkleplop, type PluginTwinkleplopOptions } from '../src'

const script = tsx()

export function makeEngine(options: PluginTwinkleplopOptions) {
  const logger = { error: vi.fn(), warn: vi.fn() }
  const engine = new ExpressiveCodeEngine({ logger, plugins: [pluginTwinkleplop(options)] })

  return { engine, logger }
}

export function render(
  engine: ExpressiveCodeEngine,
  options: {
    code?: string
    lang: string
    sourceFilePath?: string
  },
) {
  const { code = "const foo = 'bar'", lang, sourceFilePath = '/index.md' } = options

  return engine.render({ code, language: lang, parentDocument: { sourceFilePath } })
}

export function getTokens(tokenizer: LanguageFn, code: string): Token[] {
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

export function getExpressionTokens(code: string): Token[] {
  return [['expression', '{'], ...getTokens(script, code), ['expression', '}']]
}

export type RenderResult = Awaited<ReturnType<ExpressiveCodeEngine['render']>>

export type Token = [type: string, text: string]

export interface TokenizeCase {
  name: string
  code: string
  tokens: Token[]
}
