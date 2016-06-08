# Global Entry Date Finder
Given the panic over super long TSA lines you might think signing up for Global Entry would be a good idea.  Not so much when you the soonest interview date is 6+ months away.  Use this script to  poll the GOES website for appoints in your desired month.

You will receive an email with dates when found.

## Setup
Change `config.json` variables then run
```bash
brew install phantomjs
npm install
```

## How to use
`node run.js [AirportSelectIndex] [Month]`

Where `[AirportSelectIndex]` is the index of the desired airport found [here](https://goes-app.cbp.dhs.gov/main/goes/SelectEnrollmentCenterPreAction.do) and [Month] is which month you want open dates for (1-12)

Ex for dates at SFO in June run:
```bash
node run.js 92 6
```
