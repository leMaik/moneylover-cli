module.exports.command = 'income <wallet> <amount>'
module.exports.describe = 'Add an income'
module.exports.builder = (yargs) => yargs
  .positional('wallet', {
    describe: 'The wallet name',
    type: 'string'
  })
  .positional('amount', {
    describe: 'Amount of money',
    type: 'number'
  })
  .option('category', {
    describe: 'Category',
    alias: 'c',
    type: 'string'
  })
  .option('note', {
    describe: 'Transaction note',
    alias: 'm',
    type: 'string'
  })
  .option('date', {
    describe: 'Transaction date',
    alias: 'd',
    default: 'today',
    type: 'string'
  })

module.exports.handler = async (argv) => {
  const chrono = require('chrono-node')
  const { getMoneyLover, printTransaction } = require('../util')

  const ml = await getMoneyLover()
  const wallets = await ml.getWallets()
  const wallet = wallets.find(({ _id, name }) => _id === argv.wallet || name === argv.wallet)
  const categories = await ml.getCategories(wallet._id)
  let category = argv.category != null && categories.find(({ name, _id }) => name === argv.category || _id === argv.category)
  if (!category) {
    category = categories.find(({ metadata }) => metadata === 'IS_OTHER_INCOME')
  }
  const date = chrono.parseDate(argv.date)

  try {
    await ml.addTransaction({
      account: wallet._id,
      category: category._id,
      amount: `${argv.amount}`,
      note: argv.note || '',
      date
    })
    console.log('✔ Income added')
    printTransaction({
      wallet,
      category,
      amount: argv.amount,
      note: argv.note,
      date
    })
  } catch (e) {
    console.error('Could not add income', e)
    process.exit(1)
  }
}
