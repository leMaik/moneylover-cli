module.exports.command = 'login [email]'
module.exports.describe = 'Authenticate'
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
  const jwt = require('jsonwebtoken')
  const config = require('../config')
  const MoneyLover = require('../moneylover')

  let token
  if (argv.jwt) {
    token = argv.jwt
  } else if (argv.email) {
    let email = argv.email
    if (typeof email !== 'string') {
      email = require('readline-sync')
        .question('E-mail: ')
    }
    const password = require('readline-sync')
      .question('Password: ', { hideEchoBack: true, mask: '' })
    token = await MoneyLover.getToken(email, password)
  } else {
    token = await require('../chromeLogin')()
  }
  try {
    const jwtToken = jwt.decode(token)
    const ml = new MoneyLover(token)
    const userInfo = await ml.getUserInfo()
    console.log(`Logged in as ${userInfo.email} until ${new Date(jwtToken.exp * 1000)}`)
    await config.set('jwtToken', token)
    return true
  } catch (e) {
    console.error('Login failed', e)
    process.exitCode = 1
    return false
  }
}
