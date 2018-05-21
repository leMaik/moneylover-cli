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
  const fse = require('fs-extra')
  const { configFile } = require('../util')
  const MoneyLover = require('../moneylover')

  const token = argv.jwt
    ? argv.jwt
    : await MoneyLover.getToken(argv.email, require('readline-sync').question('Password: ', { hideEchoBack: true, mask: '' }))
  try {
    const jwtToken = jwt.decode(token)
    const ml = new MoneyLover(token)
    const userInfo = await ml.getUserInfo()
    console.log(`Logged in as ${userInfo.email} until ${new Date(jwtToken.exp * 1000)}`)
    await fse.writeJson(configFile, { jwtToken: token })
  } catch (e) {
    console.error('Login failed')
    process.exitCode = 1
  }
}
