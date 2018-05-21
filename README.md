# Money Lover CLI
This is a CLI tool for [Money Lover][moneylover], the "simplest way to manage personal finances" (according to their website). It has apps for iOS and Android and also a Webapp.

Money Lover CLI uses the API underneath that webapp to let you track your expenses from the command line. Because time is money, and you can save time by using some nice CLI commands.

## Installation
```
npm i -g moneylover-cli
```

## Usage
### Authentication
If you are using a Money Lover account for login, you can log in with the following command.

```
moneylover login <email>
```

If you are using Google or Facebook, you'll have to manually log into the webapp for now and extract your JWT token from the `Authorization` header of API requests (without the `Bearer` prefix), e.g. `eyJ0e…`. You can then log in with the following command.

```
moneylover login --jwt eyJ0e…
```

The token is only valid for a week, and will be cached in your home directory as `.moneylovercli`. To remove that file, run

```
moneylover logout
```

### Manage your money
Once you're authenticated, it's time to actually use the tool to manage your money.

To add a transaction, use the `expense` or `income` sub-command, e.g.

```
moneylover expense Bank -m "Fuel" -d "last friday" -c "Fuel"
```

The date is parsed using [Chrono][chrono], so you can use human-readable dates. You can also specify a category using `--category`, which can be any of the categories listed in `moneylover categories <wallet>`. It defaults to _Other_.

### Wait, there is more!
Just run `moneylover help` to get a list of all the things you can do. Every sub-command also has a `--help` flag that will show the available options.

[moneylover]: https://moneylover.me/
[chrono]: https://github.com/wanasit/chrono
