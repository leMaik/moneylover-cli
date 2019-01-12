const path = require('path')
const os = require('os')
const fse = require('fs-extra')

const configFile = path.join(os.homedir(), '.moneylovercli')
let config

async function ensureConfig () {
  if (config == null) {
    const exists = await fse.exists(configFile)
    if (!exists) {
      config = {}
    } else {
      config = await fse.readJson(configFile)
    }
  }
}

async function get (key, defaultValue = null) {
  await ensureConfig()
  return config[key] || defaultValue
}

async function set (key, value) {
  await ensureConfig()
  if (value == null) {
    delete config[key]
  } else {
    config[key] = value
  }
  await fse.writeJson(configFile, config)
}

async function clear () {
  if (await fse.exists(configFile)) {
    await fse.unlink(configFile)
  }
  config = {}
}

module.exports = {
  get,
  set,
  clear
}
