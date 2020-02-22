const popsicle = require('popsicle')
const config = require('./config')

class MoneyLoverClient {
  constructor (jwtToken) {
    this._jwtToken = jwtToken
  }

  async _postRequest (path, body, headers) {
    const res = await popsicle.request({
      method: 'POST',
      url: `https://web.moneylover.me/api${path}`,
      headers: {
        authorization: `AuthJWT ${this._jwtToken}`,
        ...headers
      },
      body
    }).use(popsicle.plugins.parse('json'))

    if (res.body.error != null && res.body.error !== 0) {
      const error = new Error(`Error ${res.body.error}, ${res.body.msg}`)
      error.code = res.body.error
      error.originalMessage = res.body.msg
      throw error
    } else if (res.body.e != null) {
      const error = new Error(`Error ${res.body.e}, ${res.body.message}`)
      error.code = res.body.e
      error.originalMessage = res.body.message
      throw error
    } else {
      return res.body.data
    }
  }

  static async getToken (email, password) {
    const loginUrl = await popsicle.request({
      method: 'POST',
      url: 'https://web.moneylover.me/api/user/login-url'
    }).use(popsicle.plugins.parse('json'))

    const res = await popsicle.request({
      method: 'POST',
      url: 'https://oauth.moneylover.me/token',
      headers: {
        authorization: `Bearer ${loginUrl.body.data.request_token}`,
        client: loginUrl.body.data.login_url.match('client=(.+?)&')[1]
      },
      body: { email, password }
    }).use(popsicle.plugins.parse('json'))

    return res.body.access_token
  }

  getUserInfo () {
    return this._postRequest('/user/info')
  }

  getWallets () {
    return this._postRequest('/wallet/list')
  }

  getWalletNames () {
    return cached('wallets', () => {
      return this._postRequest('/wallet/list')
        .then((wallets) => wallets.map(({ name, balance, _id }) => {
          for (const balanceItem of balance) {
            for (const currency of Object.keys(balanceItem)) {
              balanceItem[currency] = 0 // do not save balance to disk
            }
          }
          return {
            _id,
            name,
            balance
          }
        }))
    })
  }

  getCategories (walletId) {
    return cached(`${walletId}.categories`, () => this._postRequest('/category/list', {
      walletId
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    }))
  }

  getTransactions (walletId, startDate, endDate) {
    return this._postRequest('/transaction/list', {
      startDate: startDate.toISOString().substr(0, 10),
      endDate: endDate.toISOString().substr(0, 10),
      walletId // "all" to get the transactions of all wallets
    })
  }

  addTransaction ({ account, category, amount, note, date }) {
    return this._postRequest('/transaction/add', JSON.stringify({
        with: [], // TODO
        account,
        category,
        amount,
        note,
        displayDate: formatDate(date)
      }), {
      'Content-Type': 'application/json'
    })
  }
}

MoneyLoverClient.CATEGORY_TYPE_INCOME = 1
MoneyLoverClient.CATEGORY_TYPE_EXPENSE = 2

module.exports = MoneyLoverClient

function formatDate (date) {
  const d = new Date(date)
  let month = '' + (d.getMonth() + 1)
  let day = '' + d.getDate()
  const year = d.getFullYear()

  if (month.length < 2) month = '0' + month
  if (day.length < 2) day = '0' + day

  return [year, month, day].join('-')
}

async function cached (key, calculateValue) {
  let value = await config.get(`cache.${key}`)
  if (value == null) {
    value = await calculateValue()
    config.set(`cache.${key}`, value)
  }
  return value
}
