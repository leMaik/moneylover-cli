require('dotenv').config();

var MoneyLover = require('../moneylover');
const Table = require('cli-table3')

const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: '../credentials.json',
  scopes: 'https://www.googleapis.com/auth/spreadsheets'
});

startSheet();

async function startSheet() {
  //spreadsheet variables
  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: "v4", auth: client });
  const spreadsheetId = process.env.SPREADSHEET_ID;

  //MoneyLover login & variables
  var jwt = await MoneyLover.getToken(process.env.USERNAME, process.env.PASS);
  MoneyLover = new MoneyLover(jwt);
  let wallets = await MoneyLover.getWalletNames();
  let wallet = wallets.find(({ name }) => name === process.env.WALLET_NAME)
  let walletId = wallet._id

  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  var firstDay = new Date(process.env.START_DATE);
  var lastDay = new Date(y, m + 1, 0);

  let transactions = await MoneyLover.getTransactions(walletId, firstDay, lastDay);

  var testArray = [['Id', 'Date', 'Portafoglio', 'Note', 'Tipo', 'Categoria', 'Amount']];
  for (const t of transactions['transactions']) {
    var amount = Math.floor(t.amount * 100) / 100;
    testArray.push([
      t._id,
      t.displayDate,
      t.account.name,
      t.note,
      t.category.type == '1' ? 'Income' : 'Expense',
      t.category.name,
      t.category.type == '1' ? amount : amount * -1
    ])
  }

  await googleSheets.spreadsheets.values.clear(
    {
      auth,
      spreadsheetId,
      range: process.env.SHEET_NAME
    }
  )

  await googleSheets.spreadsheets.values.append(
    {
      auth,
      spreadsheetId,
      range: process.env.SHEET_NAME,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values:
          testArray
      }
    }
  )


}