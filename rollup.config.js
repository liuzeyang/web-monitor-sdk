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

const packageDirDist = `${packageDir}/dist`

const name = path.basename(packageDir)

const packageDirs = fs.readdirSync(packagesDir)