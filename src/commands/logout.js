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
  const config = require('../config')
  if (config.get('jwtToken') != null) {
    try {
      await config.clear()
      console.log('Logged out')
    } catch (e) {
      console.error(e)
    }
  } else {
    console.error('Was not logged in')
  }
}
