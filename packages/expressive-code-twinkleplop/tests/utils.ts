import { ExpressiveCodeEngine } from '@expressive-code/core'
import { vi } from 'vitest'

import { pluginTwinkleplop, type PluginTwinkleplopOptions } from '../src'

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

export type RenderResult = Awaited<ReturnType<ExpressiveCodeEngine['render']>>
