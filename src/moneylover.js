const popsicle = require('popsicle')

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
    if (res.body.error !== 0) {
      console.error(res.request)
      throw new Error(`Error ${res.body.error}, ${res.body.msg}`)
    } else {
      return res.body.data
    }
  }

  getUserInfo () {
    return this._postRequest('/user/info')
  }

  getWallets () {
    return this._postRequest('/wallet/list')
  }

  getCategories (walletId) {
    return this._postRequest('/category/list', {
      walletId
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
    })
  }

  addTransaction ({ account, category, amount, note, date }) {
    return this._postRequest('/transaction/add', {
      transInfo: JSON.stringify({
        with: [], // TODO
        account,
        category,
        amount,
        note,
        displayDate: formatDate(date)
      })
    }, {
      'Content-Type': 'application/x-www-form-urlencoded'
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
