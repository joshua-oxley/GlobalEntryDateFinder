const ScrapeGlobalEntry = require('./ScrapeGlobalEntry');

if (process.argv[0] === '-h' || process.argv[0] === '--help' || process.argv.length !== 4) {
  console.log('Usage: node run.js [AirportSelectIndex] [Month]')
} else {
  new ScrapeGlobalEntry(process.argv[1], process.argv[2]);
}
