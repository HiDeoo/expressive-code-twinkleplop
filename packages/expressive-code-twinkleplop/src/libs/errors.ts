import { styleText } from 'node:util'

import type { ResolvedExpressiveCodeEngineConfig } from '@expressive-code/core'

export class UserError extends Error {
  constructor(message: string, hint: string) {
    super(`${message}\n\n${formatHint(hint)}\n`)

    this.name = 'UserError'
  }
}

export function warnUser(logger: ResolvedExpressiveCodeEngineConfig['logger'], message: string, hint: string) {
  logger.warn(`${message}\n  ${formatHint(hint)}`)
}

function formatHint(hint: string) {
  return `${styleText('bold', 'Hint:')} ${styleText('yellow', hint)}`
}
