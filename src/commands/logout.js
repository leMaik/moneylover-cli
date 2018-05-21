module.exports.command = 'logout'
module.exports.describe = 'Remove the authentication file'
module.exports.builder = (yargs) => yargs
  .positional('email', {
    describe: 'E-mail address',
    type: 'string'
  })
  .option('jwt', {
    describe: 'Authenticate using a JWT token',
    type: 'string'
  })

module.exports.handler = async (argv) => {
  const fse = require('fs-extra')
  const { configFile } = require('../util')

  try {
    await fse.unlink(configFile)
    console.log('Logged out')
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.error('Was not logged in')
    }
  }
}
