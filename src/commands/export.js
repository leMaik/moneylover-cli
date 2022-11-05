require('dotenv').config();

var MoneyLover = require('../moneylover');
const chrono = require('chrono-node');
const Table = require('cli-table3')

// start();

async function start() {

    var jwt = await MoneyLover.getToken(process.env.USERNAME, process.env.PASS);
    MoneyLover = new MoneyLover(jwt);
    let wallets = await MoneyLover.getWalletNames();
    let wallet = wallets.find(({ name }) => name === 'Principale')
    let walletId = wallet._id

    var date = new Date(), y = date.getFullYear(), m = date.getMonth()-1;
    var firstDay = new Date(y, m, 1);
    var lastDay = new Date(y, m + 1, 0);

    let transactions = await MoneyLover.getTransactions(walletId, firstDay, lastDay);

    const table = new Table({
        chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
        head: ['Date', 'Wallet', 'Note', 'Type', 'Category', 'Amount']
    })

    for (const t of transactions['transactions']) {
        table.push([
            new Date(t.displayDate).toDateString(),
            t.account.name,
            t.note,
            t.category.type === MoneyLover.CATEGORY_TYPE_INCOME ? 'Income' : 'Expense',
            t.category.name,
            Math.floor(t.amount * 100) / 100
        ])
    }

    console.log(table);

    // return result;
}