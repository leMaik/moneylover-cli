const { prompt } = require('inquirer')
const jwt = require('jsonwebtoken')
const MoneyLover = require('./moneylover')
const config = require('./config')

async function hasValidToken () {
  let jwtToken = await config.get('jwtToken')
  if (!jwtToken) {
    return false
  }

  jwtToken = jwt.decode(jwtToken)
  return jwtToken.exp * 1000 > Date.now()
}

async function getMoneyLover () {
  if (!(await hasValidToken())) {
    if (!process.stdin.isTTY) {
      console.error('Error: Not logged in')
      process.exit(1)
    }

    const method = await promptOne({
      message: 'You need to log in first. How to proceed?',
      type: 'list',
      choices: [
        'Log in with E-mail and password',
        'Log in via Browser',
        'Exit'
      ],
      tranformer: (input, answer) => input,
      default: 'Log in via Browser'
    })

    if (method === 'Exit') {
      process.exit(0) // User wanted to exit
    }

    if (!(await require('./commands/login').handler({
      email: method.indexOf('E-mail') >= 0
    }))) {
      process.exit(1)
    }
  }

  return new MoneyLover(await config.get('jwtToken'))
}

function printTransaction (transaction) {
  console.log(`Category: ${transaction.category.name}`)
  console.log(`Amount:   ${Object.keys(transaction.wallet.balance[0])[0]} ${transaction.amount}`)
  console.log(`Note:     ${transaction.note}`)
  console.log(`Date:     ${transaction.date.toLocaleDateString()}`)
  console.log(`Wallet:   ${transaction.wallet.name}`)
}

function promptOne(question) {
  return prompt([{
    ...question,
    name: 'question'
  }]).then(({ question }) => question)
}

module.exports = {
  getMoneyLover,
  printTransaction,
  promptOne
}
