module.exports.command = 'transactions [wallet]'
module.exports.describe = 'Get the transactions list'
module.exports.builder = (yargs) => yargs
  .positional('wallet', {
    describe: 'The wallet name',
    type: 'string'
  })
  .option('startDate', {
    describe: 'Show transactions starting from',
    type: 'string',
    default: 'today'
  })
  .option('endDate', {
    describe: 'Show transactions ending at',
    type: 'string',
    default: 'today'
  })
  .option('income', {
    describe: 'Only show income transactions',
    type: 'bool'
  })
  .option('expense', {
    describe: 'Only show expense transactions',
    type: 'bool'
  })

module.exports.handler = async (argv) => {
  const chrono = require('chrono-node')
  const Table = require('cli-table3')
  const { getMoneyLover } = require('../util')
  const MoneyLover = require('../moneylover')

  const ml = await getMoneyLover()
  const wallets = await ml.getWalletNames()
  let walletId = 'all'
  if (argv.wallet) {
      let wallet = wallets.find(({ _id, name }) => _id === argv.wallet || name === argv.wallet)
      if (wallet == null) {
        console.error('Wallet not found')
        process.exit(1)
      } else {
        walletId = wallet._id
      }
  }

  let transactions = await ml.getTransactions(walletId, chrono.parseDate(argv.startDate), chrono.parseDate(argv.endDate))

  if (argv.income) {
    transactions = transactions.transactions.filter((t) => t.category.type === MoneyLover.CATEGORY_TYPE_INCOME)
  } else if (argv.expense) {
    transactions = transactions.transactions.filter((t) => t.category.type === MoneyLover.CATEGORY_TYPE_EXPENSE)
  } else {
    transactions = transactions.transactions;
  }

  const table = new Table({
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
    head: ['Date', 'Wallet', 'Note', 'Type', 'Category', 'Amount']
  })
  for (const t of transactions) {
    table.push([
      new Date(t.displayDate).toDateString(),
      t.account.name,
      t.note,
      t.category.type === MoneyLover.CATEGORY_TYPE_INCOME ? 'Income' : 'Expense',
      t.category.name,
      Math.floor(t.amount * 100) / 100
    ])
  }
  console.log(table.toString())
}
