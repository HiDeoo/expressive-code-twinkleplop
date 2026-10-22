import { defineConfig } from 'tsdown'

export default defineConfig({
  dts: true,
  entry: ['src/index.ts'],
  fixedExtension: false,
  publint: { strict: true },
  root: 'src',
  unbundle: true,
})
