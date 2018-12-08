module.exports.command = 'wallets'
module.exports.describe = 'List your wallets'
module.exports.builder = (yargs) => yargs

module.exports.handler = async (argv) => {
  const chalk = require('chalk')
  const Table = require('cli-table3')
  const Decimal = require('decimal.js')
  const { getMoneyLover } = require('../util')

  const ml = await getMoneyLover()
  const wallets = await ml.getWallets()
  const table = new Table({
    head: ['Name', { colSpan: 2, content: 'Balance' }]
  })

  for (const wallet of wallets) {
    const balances = Object.keys(wallet.balance[0])
    const balance = wallet.balance[0][balances[0]]
    table.push([
      wallet.name,
      wallet.exclude_total ? chalk.gray(balances[0]) : balances[0],
      { hAlign: 'right', content: wallet.exclude_total ? chalk.gray(balance) : balance }
    ])
  }

  const totals = {}
  for (const wallet of wallets) {
    if (!wallet.exclude_total) {
      const balances = Object.keys(wallet.balance[0])
      const balance = wallet.balance[0][balances[0]]
      if (!totals[balances[0]]) {
        totals[balances[0]] = new Decimal(0)
      }
      totals[balances[0]] = totals[balances[0]].plus(new Decimal(balance))
    }
  }
  for (const balance of Object.keys(totals)) {
    table.push([
      '',
      balance,
      { hAlign: 'right', content: totals[balance].toString() }
    ])
  }

  console.log(table.toString())
}
