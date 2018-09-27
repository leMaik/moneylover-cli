const { prompt } = require('inquirer')
const MoneyLover = require('./moneylover')
const config = require('./config')

async function getMoneyLover () {
  if (config.get('jwtToken') == null) {
    console.error('Error: Not logged in')
    process.exit(1)
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
