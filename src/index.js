#!/usr/bin/env node

// eslint-disable-next-line no-unused-expressions
require('yargs')
  .command(require('./commands/login'))
  .command(require('./commands/logout'))
  .command(require('./commands/wallets'))
  .command(require('./commands/categories'))
  .command(require('./commands/expense'))
  .command(require('./commands/income'))
  .command(require('./commands/transactions'))
  .command(require('./commands/export'))
  .command(require('./commands/GSheet'))
  .argv
