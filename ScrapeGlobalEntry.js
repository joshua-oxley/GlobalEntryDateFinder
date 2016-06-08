'use strict';
const GLOBAL_ENTRY_START_URL = 'https://goes-app.cbp.dhs.gov/main/goes';
const config = require('./config.json');
const sendgrid = require('sendgrid')(config.SENGRID_KEY);
const Spooky = require('spooky');

class GobalEntryScraper {
  constructor() {
    this.spooky = new Spooky({
      child: {
        transport: 'http',
      },
      casper: {
        logLevel: 'debug',
        verbose: true,
      },
    }, this.run.bind(this));

    this.spooky.on('console', (line) => {
      console.log(line);
    });

    this.spooky.on('error', function(e, stack) {
      console.error(e);
      if (stack) {
        console.log(stack);
      }
    });

    this.spooky.on('found', function(availableDays) {
      console.log(`found:${availableDays}`);
      sendgrid.send({
        to: config.EMAIL,
        from: config.EMAIL,
        subject: 'Global Entry Found Date',
        text: availableDays.toString(),
      }, (err) => {
        if (err) {
          console.error(err);
        }
      });
    });

    this.spooky.on('not found', () => {
      console.log('not found');
    });
  }

  run(err) {
    if (err) {
      throw err;
    } else {
      this.spooky.start(GLOBAL_ENTRY_START_URL);
      this.login();
      this.navigateToReschedule();
      this.selectAirport(92); // SFO
      // Set to 1st day of month- since we are viewing by month this doesn't matter
      this.setMonthAndView(1, 1, 17);
      this.findAvailableDays();
      this.spooky.run();
    }
  }

  login(username, password) {
    this.spooky.waitForSelector('input[name="username"]',
      [{ username: config.USERNAME, password: config.PASSWORD },
        function() {
          this.fillSelectors('form[action="/pkmslogin.form"]', {
            'input[name="username"]': username,
            'input[name="password"]': password,
          }, true);
        },
      ]);
  }

  navigateToReschedule() {
    this.spooky.waitForSelector('a[href="/main/goes/HomePagePreAction.do"]',
      function() {
        this.click('a[href="/main/goes/HomePagePreAction.do"]');
      });

    this.spooky.waitForSelector('input[name="manageAptm"]',
      function() {
        this.click('input[name="manageAptm"]');
      });

    this.spooky.waitForSelector('input[name="reschedule"]',
      function() {
        this.click('input[name="reschedule"]');
      });
  }

  selectAirport(selectedIndex) {
    this.spooky.thenEvaluate(function(selectedIndex) {
      document.querySelector('select').selectedIndex = selectedIndex;
    }, {
      selectedIndex: selectedIndex
    });
    this.spooky.thenClick('input[name="next"]');
  }

  setMonthAndView(month, day, year) {
    this.spooky.thenEvaluate(function(month, day, year) {
      // Set month
      document.forms.scheduleForm.elements['scheduleForm:scheduleNavigator'].value
        = [month, day, year].join('/');
      // Set month view
      document.forms.scheduleForm.elements['scheduleForm:modeInput'].value = 2;
      document.forms.scheduleForm.submit();
    }, {
      month: month,
      day: day,
      year: year
    });
  }

  findAvailableDays() {
    this.spooky.then(function() {
      var days = this.evaluate(function() {
        var availableDaysInCalendar = document.querySelectorAll('table.day .content a');
        var dateString;
        var matches;
        var availableDays = [];
        var dateRegex = /_body_\d{4}(.{2})(.{2})/;
        for (var i = 0; i < availableDaysInCalendar.length; ++i) {
          matches = dateRegex.exec(availableDaysInCalendar[i].parentNode.id);
          dateString = matches[1] + '/' + matches[2];
          availableDays.push(dateString);
        }
        return availableDays;
      });
      this.emit(days.length);
      if (days.length) {
        this.emit('found', days);
      } else {
        this.emit('not found');
      }
    });
  }
}

module.exports = GobalEntryScraper;
