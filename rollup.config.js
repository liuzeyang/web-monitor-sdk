import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import clear from 'rollup-plugin-clear'
import cleanup from 'rollup-plugin-cleanup'
import size from 'rollup-plugin-sizes'
import { visualizer } from 'rollup-plugin-visualizer'

const path = require('path')

const fs = require('fs')

if (!process.env.TARGET) {
  throw new Error('Target package must be specified')
}
// 是否生成声明文件
const isDeclaration = process.env.TYPES !== 'false'
const masterVersion = require('./package.json').version

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
// 输出地址
const packageDirDist = process.env.LOCALDIR === 'undefined' ? `${packageDir}/dist` : process.env.LOCALDIR

const name = path.basename(packageDir)

const packageDirs = fs.readdirSync(packagesDir)

const paths = {}
packageDirs.forEach((dir) => {
  if (dir.startsWith('.')) {
    return
  }
  paths[`@jason-monitor/${dir}`] = [`${packagesDir}/${dir}/src`]
})

const common = {
  input: `${packageDir}/src/index.ts`,
  output: {
    banner: `/* @jason-monitor/${name} version ' + ${masterVersion} */`,
    footer: '/* follow me on Github! @jasonlzy */'
  },
  external: [...Object.keys(paths)],
  plugins: [
    resolve(),
    size(),
    visualizer(),
    json(),
    commonjs({
      exclude: 'node_modules'
    }),
    cleanup({
      comments: 'none'
    }),
    typescript({
      tsconfig: 'tsconfig.build.json',
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          declaration: isDeclaration,
          declarationMap: isDeclaration,
          declarationDir: `${packageDirDist}/packages/`, // 类型声明文件的输出目录
          module: 'ES2015',
          paths
        }
      },
      include: ['*.ts+(|x)', '**/*.ts+(|x)', '../**/*.ts+(|x)']
    })
  ]
}

const esmPackage = {
  ...common,
  output: {
    file: `${packageDirDist}/${name}.esm.js`,
    format: 'es',
    name: 'JMT',
    sourcemap: true,
    ...common.output
  },
  plugins: [
    ...common.plugins,
    clear({
      targets: [packageDirDist]
    })
  ]
}
const cjsPackage = {
  ...common,
  external: [],
  output: {
    file: `${packageDirDist}/${name}.js`,
    format: 'cjs',
    name: 'JMT',
    sourcemap: true,
    minifyInternalExports: true,
    ...common.output
  },
  plugins: [...common.plugins]
}

const iifePackage = {
  ...common,
  external: [],
  output: {
    file: `${packageDirDist}/${name}.min.js`,
    format: 'iife',
    name: 'JMT',
    ...common.output
  },
  plugins: [...common.plugins, terser()]
}
const total = {
  esmPackage,
  iifePackage,
  cjsPackage
}
let result = total
export default [...Object.values(result)]