const path = require('path')
const chalk = require('chalk')
const fs = require('fs')

const { getArgv, scheduler, runBin, target } = require('./utils')

let buildTypes = true
let rollupWatch = false
let LOCALDIR = ''

run()

async function run() {
  const argv = getArgv()

  const paramsTarget = argv._

  LOCALDIR = argv.local
  buildTypes = argv.buildTypes !== 'false'
  rollupWatch = argv.rollupWatch === undefined ? false : argv.rollupWatch !== 'true'

  if (paramsTarget.length !== 0) {
    buildAll(paramsTarget)
  } else {
    buildAll(target)
  }
}

async function buildAll(targets) {
  for (const item of targets) {
    scheduler.addTask(() => {
      return rollupBuild(item)
    })
  }
}

async function rollupBuild(target) {
  const pkgDir = path.resolve(`packages/${target}`)
  const pkg = require(`${pkgDir}/package.json`)
  if (pkg.private) {
    return
  }
  const args = [
    '-c',
    '--environment',
    [
      `TARGET:${target}`,
      `TYPES:${buildTypes}`,
      `LOCALDIR:${LOCALDIR}`
    ].filter(Boolean).join(',')
  ]
  rollupWatch && args.push('--watch')
  await runBin('rollup', args)
  if (buildTypes && pkg.types) {
    console.log(chalk.bold(chalk.yellow(`Rolling up type definitions for ${target}...`)))

    // build types
    const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor')

    const extractorConfigPath = path.resolve(pkgDir, `api-extractor.json`)
    const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath)
    const extractorResult = Extractor.invoke(extractorConfig, {
      localBuild: true,
      showVerboseMessages: false
    })
    if (extractorResult.succeeded) {
      console.log(chalk.bold(chalk.green(`API Extractor completed successfully.`)))
    }
    console.log('pkgDir', pkgDir)
    fs.rmSync(`${pkgDir}/dist/packages`, { recursive: true, force: true })
  }
}
