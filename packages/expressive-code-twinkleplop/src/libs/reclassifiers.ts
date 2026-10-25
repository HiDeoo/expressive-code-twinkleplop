import { promote_pascal_case, rewrite_types, tag, type as tokenType, type LanguagePipeline } from '@twinkleplop/core'

// Highlight tag names referencing components which can be capitalized and dotted, e.g. in `<Astro.self />`.
export function promoteComponentTagNames(component: string): LanguagePipeline {
  return [
    tag(promote_pascal_case('tag_name', component), [component]),
    tag(
      rewrite_types([
        { anchor: 'tag_name', when: tokenType('punctuation', '.'), rewrite: component },
        { anchor: 'tag_name', before: tokenType('punctuation', '.'), rewrite: component },
      ]),
      [component],
    ),
  ]
}
