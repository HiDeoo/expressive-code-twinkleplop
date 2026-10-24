import type { LanguageFn } from '@twinkleplop/core'
import { expectTypeOf, test } from 'vitest'

import type { Language } from '../src/libs/languages'

test('accepts Twinkleplop tokenizers', () => {
  expectTypeOf<LanguageFn>().toExtend<Language>()
})
