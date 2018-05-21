#!/usr/bin/env node
const chalk = require('chalk').default
const chrono = require('chrono-node')
const fse = require('fs-extra')
const jwt = require('jsonwebtoken')
const os = require('os')
const path = require('path')
const MoneyLover = require('./moneylover')

const configFile = path.join(os.homedir(), '.moneylovercli')

// eslint-disable-next-line no-unused-expressions
require('yargs')
  .command('login [email]', 'Authenticate', (yargs) => {
    yargs
      .positional('email', { describe: 'E-mail address', type: 'string' })
      .option('jwt', { describe: 'Authenticate using a JWT token' })
  }, async (argv) => {
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
    }
  })
  .command('logout', 'Remove authentication file', () => {}, async (argv) => {
    try {
      await fse.unlink(configFile)
      console.log('Logged out')
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.error('Was not logged in')
      }
    }
  })
  .command('wallets', 'List your wallets', () => {}, async (argv) => {
    const ml = await getMoneyLover()
    const wallets = await ml.getWallets()
    const Table = require('cli-table2')
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
        totals[balances[0]] = (totals[balances[0]] || 0) + parseFloat(balance)
      }
    }
    for (const balance of Object.keys(totals)) {
      table.push([
        '',
        balance,
        { hAlign: 'right', content: totals[balance] }
      ])
    }

    console.log(table.toString())
  })
  .command('categories <wallet>', 'Get the expense/income categories of a wallet', (yargs) => {
    yargs
      .positional('wallet', { describe: 'The wallet name', type: 'string' })
      .option('income', { describe: 'Only show income categories', type: 'bool' })
      .option('expense', { describe: 'Only show expense categories', type: 'bool' })
  }, async (argv) => {
    const ml = await getMoneyLover()
    const wallets = await ml.getWallets()
    const wallet = wallets.find(({ _id, name }) => _id === argv.wallet || name === argv.wallet)
    if (wallet == null) {
      console.error('Wallet not found')
    } else {
      let categories = await ml.getCategories(wallet._id)
      if (argv.income) {
        categories = categories.filter(({ type }) => type === MoneyLover.CATEGORY_TYPE_INCOME)
      } else if (argv.exppense) {
        categories = categories.filter(({ type }) => type === MoneyLover.CATEGORY_TYPE_EXPENSE)
      }

      const Table = require('cli-table2')
      const table = new Table({
        chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
        head: ['Name', 'Type']
      })
      for (const { name, type } of categories) {
        table.push([name, type === MoneyLover.CATEGORY_TYPE_INCOME ? 'Income' : 'Expense'])
      }
      console.log(table.toString())
    }
  })
  .command('expense <wallet> <amount>', 'Add an expense', (yargs) => {
    yargs
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
        default: '',
        type: 'string'
      })
      .option('date', {
        describe: 'Transaction date',
        alias: 'd',
        default: 'today',
        type: 'string'
      })
  }, async (argv) => {
    const ml = await getMoneyLover()
    const wallets = await ml.getWallets()
    const wallet = wallets.find(({ _id, name }) => _id === argv.wallet || name === argv.wallet)
    const categories = await ml.getCategories(wallet._id)
    let category = argv.category != null && categories.find(({ name, _id }) => name === argv.category || _id === argv.category)
    if (!category) {
      category = categories.find(({ metadata }) => metadata === 'IS_OTHER_EXPENSE')
    }
    const date = chrono.parseDate(argv.date)

    try {
      await ml.addTransaction({
        account: wallet._id,
        category: category._id,
        amount: `${argv.amount}`,
        note: argv.note,
        date
      })
      console.log('✔ Expense added')
      printTransaction({
        wallet,
        category,
        amount: argv.amount,
        note: argv.note,
        date
      })
    } catch (e) {
      console.error('Could not add expense', e)
    }
  })
  .command('income <wallet> <amount>', 'Add an income', (yargs) => {
    yargs
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
        default: '',
        type: 'string'
      })
      .option('date', {
        describe: 'Transaction date',
        alias: 'd',
        default: 'today',
        type: 'string'
      })
  }, async (argv) => {
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
        note: argv.note,
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
    }
  })
  .argv

async function getMoneyLover () {
  return new MoneyLover((await fse.readJson(configFile)).jwtToken)
}

function printTransaction (transaction) {
  console.log(`Category: ${transaction.category.name}`)
  console.log(`Amount:   ${Object.keys(transaction.wallet.balance[0])[0]} ${transaction.amount}`)
  console.log(`Note:     ${transaction.note}`)
  console.log(`Date:     ${transaction.date.toLocaleDateString()}`)
  console.log(`Wallet:   ${transaction.wallet.name}`)
}
