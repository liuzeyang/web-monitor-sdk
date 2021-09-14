const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const execa = require('execa')

const target = fs.readdirSync('packages').filter((dir) => {
  if (!fs.statSync(`packages/${dir}`).isDirectory()) {
    return false
  }
  return true
})

const getArgv = () => {
  let argv = minimist(process.argv.slice(2))
  return argv
}

const runBin = (bin, argv, opts = {}) => execa(bin, argv, { stdio: 'inherit', ...opts })

const step = (msg) => console.log(chalk.cyan(msg))

const error = (msg) => console.log(chalk.red(msg))

class Pool {

  maxConcurrency = 0
  runTasks = []
  waitTasks = []

  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency
  }

  addTask(task) {
    return new Promise((resolve, reject) => {
      task.resolve = resolve
      task.reject = reject
      if (this.runTasks.length >= this.maxConcurrency) {
        this.waitTasks.push(task)
      } else {
        this.waitTasks.push(task)
        this.runTask()
      }
    })
  }

  runTask() {
    let task = this.waitTasks.shift()
    this.runTasks.push(task)
    task().then(() => {
      task.resolve()
      this.removeTask(task)
      if (this.waitTasks.length > 0) {
        this.runTask()
      }
    }).catch(e => {
      task.reject(e)
    })
  }

  removeTask(task) {
    let index = this.runTasks.indexOf(task)
    index !== -1 && this.runTasks.splice(index, 1)
  }
}

const scheduler = new Pool(10)

module.exports = {
  target,
  getArgv,
  runBin,
  step,
  error,
  scheduler
}