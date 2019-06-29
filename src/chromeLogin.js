/**
 * Authenticate the user by launching Chrome and return a JWT access token.
 */
async function loginWithChrome () {
  const chromeLauncher = require('chrome-launcher')
  const CDP = require('chrome-remote-interface')

  const chrome = await chromeLauncher.launch({
    startingUrl: 'https://web.moneylover.me'
  })
  const client = await CDP({ host: 'localhost', port: chrome.port })
  const {Network, Page} = client

  await Promise.all([Network.enable(), Page.enable()])
  return new Promise((resolve) => {
    Network.requestWillBeSent(async (params) => {
      const match = /^https:\/\/web\.moneylover\.me\/\?access_token=(.+?)&/i.exec(params.request.url)
      if (match) {
        await client.close()
        await chrome.kill()
        resolve(match[1])
      }
    })
  })
}

module.exports = loginWithChrome
