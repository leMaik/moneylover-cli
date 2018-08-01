const os = require('os')
const fse = require('fs-extra')
const path = require('path')
const { prompt } = require('inquirer')
const MoneyLover = require('./moneylover')

const configFile = path.join(os.homedir(), '.moneylovercli')

async function getMoneyLover () {
  const exists = await fse.exists(configFile)
  if (!exists) {
    console.error('Error: Not logged in')
    process.exit(1)
  }
  return new MoneyLover((await fse.readJson(configFile)).jwtToken)
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
  configFile,
  getMoneyLover,
  printTransaction,
  promptOne
}
