module.exports.command = 'categories <wallet>'
module.exports.describe = 'Get the expense/income categories of a wallet'
module.exports.builder = (yargs) => yargs
  .positional('wallet', {
    describe: 'The wallet name',
    type: 'string'
  })
  .option('income', {
    describe: 'Only show income categories',
    type: 'bool'
  })
  .option('expense', {
    describe: 'Only show expense categories',
    type: 'bool'
  })

module.exports.handler = async (argv) => {
  const Table = require('cli-table3')
  const { getMoneyLover } = require('../util')
  const MoneyLover = require('../moneylover')

  const ml = await getMoneyLover()
  const wallets = await ml.getWalletNames()
  const wallet = wallets.find(({ _id, name }) => _id === argv.wallet || name === argv.wallet)
  if (wallet == null) {
    console.error('Wallet not found')
    process.exit(1)
  } else {
    let categories = await ml.getCategories(wallet._id)
    if (argv.income) {
      categories = categories.filter(({ type }) => type === MoneyLover.CATEGORY_TYPE_INCOME)
    } else if (argv.expense) {
      categories = categories.filter(({ type }) => type === MoneyLover.CATEGORY_TYPE_EXPENSE)
    }

    const table = new Table({
      chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
      head: ['Name', 'Type']
    })
    for (const { name, type } of categories) {
      table.push([name, type === MoneyLover.CATEGORY_TYPE_INCOME ? 'Income' : 'Expense'])
    }
    console.log(table.toString())
  }
}
