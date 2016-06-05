const GLOBAL_ENTRY_START_URL = 'https://goes-app.cbp.dhs.gov/main/goes';
const DATE_REGEX = /_body_2016(.{2})(.{2})/;

const config = require('./config.json');
const sendgrid = require('sendgrid')(config.SENGRID_KEY);
const Spooky = require('spooky');

module.exports = (function() {
  return {
    run: function() {
      const spooky = new Spooky({
        child: {
          transport: 'http',
        },
        casper: {
          logLevel: 'debug',
          verbose: true,
        },
      }, (err) => {
        if (err) {
          throw err;
        }

        spooky.start(GLOBAL_ENTRY_START_URL);
        spooky.waitForSelector('input[name="username"]',
          [{ username: config.USERNAME, password: config.PASSWORD},
            function() {
              this.fillSelectors('form[action="/pkmslogin.form"]', {
                'input[name="username"]': username,
                'input[name="password"]': password,
              }, true);
            }
          ]);
        spooky.waitForSelector('a[href="/main/goes/HomePagePreAction.do"]',
          function redirectHome() {
            this.click('a[href="/main/goes/HomePagePreAction.do"]');
          });

        spooky.waitForSelector('input[name="manageAptm"]', function() {
          this.click('input[name="manageAptm"]');
        });

        spooky.waitForSelector('input[name="reschedule"]', function() {
          this.click('input[name="reschedule"]');
        });

        spooky.thenEvaluate(function() {
          document.querySelector('select').selectedIndex = 94; // SFO
        });

        spooky.thenClick('input[name="next"]');

        spooky.thenEvaluate(function() {
          // Set month
          document.forms.scheduleForm.elements['scheduleForm:scheduleNavigator'].value = '01/01/17';
          // Set month view
          document.forms.scheduleForm.elements['scheduleForm:modeInput'].value = 2;
          document.forms.scheduleForm.submit();
        });

        spooky.then(function() {
          var days = this.evaluate(function() {
            var availableDaysInCalendar = document.querySelectorAll('table.day .content a');
            var dateString;
            var matches;
            var availableDays = [];

            for(var i = 0; i < availableDaysInCalendar.length; ++i){
              matches = /_body_\d{4}(.{2})(.{2})/.exec(availableDaysInCalendar[i].parentNode.id);
              dateString = matches[1] + '/' + matches[2];
              availableDays.push(dateString);
            }
            return availableDays;
          });

          if (days.length) {
            this.emit('found', days);
          } else {
            this.emit('not found');
          }
        });
        spooky.run();
      });

      spooky.on('error', function handleError(e, stack) {
        console.error(e);
        if (stack) {
          console.log(stack);
        }
      });

      spooky.on('console', function handleConsole(line) {
        console.log(line);
      });

      spooky.on('found', function handleFound(availableDays) {
        console.log('found:' + availableDays);
        sendgrid.send({
          to: config.EMAIL,
          from: config.EMAIL,
          subject: 'Global Entry Found Date',
          text: availableDays.toString(),
        }, function handleError(err, json) {
          if (err) {
            return console.error(err);
          }
        });
      });

      spooky.on('not found', function handleNotFound() {
        console.log('not found');
      });
    }
  }
})();
