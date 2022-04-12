'use strict';

import 'core-js/stable';
import 'regenerator-runtime/runtime';

const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2021-11-07T17:01:17.194Z',
    '2021-11-08T19:01:17.194Z',
    '2021-11-10T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

/////////////////////////////////////////////////
// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

// Functions

// creating an array with movs and dates
const movsDatesJoin = function (acc) {
  acc.movsWithDates = [];
  acc.movements.forEach((mov, i) =>
    acc.movsWithDates.push([mov, acc.movementsDates[i]])
  );
};
movsDatesJoin(account1);
movsDatesJoin(account2);

// Formatting Date and time
const formattedDate = function (locale, date) {
  const calcTimePassed = (day1, day2) =>
    Math.round(Math.abs(day2 - day1) / (1000 * 60 * 60 * 24));

  const timePassed = calcTimePassed(new Date(), date);

  if (timePassed === 0) return 'today';
  if (timePassed === 1) return 'yesterday';
  if (timePassed <= 7) return `${timePassed} days ago`;

  return new Intl.DateTimeFormat(locale).format(date);
};

// Formatting Currency
const formattedCur = function (value, loc, cur) {
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency: cur,
  }).format(value);
};

// Display Movements
const displayMovements = function (acc, sort = false) {
  containerMovements.innerHTML = '';

  // Sorting
  const movs = sort
    ? acc.movsWithDates.slice().sort((a, b) => a[0] - b[0])
    : acc.movsWithDates;

  movs.forEach(function (mov, i) {
    const type = mov[0] > 0 ? 'deposit' : 'withdrawal';

    // Creating Date and time
    const date = new Date(mov[1]);
    const displayDate = formattedDate(acc.locale, date);

    // Formatting movements
    const formattedMovs = formattedCur(mov[0], acc.locale, acc.currency);

    const html = `
    <div class="movements__row">
      <div class="movements__type movements__type--${type}">${
      i + 1
    } ${type}</div>
      <div class="movements__date">${displayDate}</div>
      <div class="movements__value">${formattedMovs}</div>
    </div>`;

    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

// Display Balance
const displayBalance = function (acc) {
  const balance = acc.movsWithDates.reduce((sum, mov) => sum + mov[0], 0);
  acc.balance = balance;

  labelBalance.textContent = formattedCur(
    acc.balance,
    acc.locale,
    acc.currency
  );
};

// Display Summary
const displaySummary = function (acc) {
  const incomings = acc.movsWithDates
    .filter(mov => mov[0] > 0)
    .reduce((sum, mov) => sum + mov[0], 0);
  labelSumIn.textContent = formattedCur(incomings, acc.locale, acc.currency);

  const outgoings = acc.movsWithDates
    .filter(mov => mov[0] < 0)
    .reduce((sum, mov) => sum + Math.abs(mov[0]), 0);
  labelSumOut.textContent = formattedCur(outgoings, acc.locale, acc.currency);

  const interest = acc.movsWithDates
    .map(mov => (mov[0] * acc.interestRate) / 100)
    .filter(int => int > 1)
    .reduce((sum, int) => sum + int, 0);
  labelSumInterest.textContent = formattedCur(
    interest,
    acc.locale,
    acc.currency
  );
};

// Creating Username
const createUserName = function (accs) {
  accs.forEach(function (acc, i) {
    const userName = acc.owner.toLowerCase().split(' ');
    acc.userName = userName.map(own => own[0]).join('');
  });
};
createUserName(accounts);

// Update UI
const updateUI = function (acc) {
  displayMovements(acc);
  displayBalance(acc);
  displaySummary(acc);
};

// Implementing Login
let currentAccount, timer;

// SET TIMEOUT
const logOutTimer = function () {
  // Tick function
  const tick = function () {
    const min = String(Math.trunc(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    labelTimer.textContent = `${min}:${sec}`;

    // Clear interval when time hits 0
    if (time === 0) {
      clearInterval(timer);
      containerApp.style.opacity = 0;
      labelWelcome.textContent = 'Login to get started';
    }

    // Decrease time by 1
    time--;
  };

  // Set timer to 5 mins
  let time = 60;

  // Set interval
  tick(); // ***Calls the tick function instantly
  const timer = setInterval(tick, 1000);

  return timer;
};

// FAKING LOGIN
// currentAccount = account1;
// updateUI(currentAccount);
// containerApp.style.opacity = 1;
// labelWelcome.textContent = 'Login to get started';

btnLogin.addEventListener('click', function (e) {
  // Prevent form from submitting
  e.preventDefault();

  currentAccount = accounts.find(
    acc => inputLoginUsername.value === acc.userName
  );

  if (currentAccount?.pin === +inputLoginPin.value) {
    console.log(currentAccount);

    // Displaying UI and message
    containerApp.style.opacity = 1;
    labelWelcome.textContent = `Welcome, ${currentAccount.owner.split(' ')[0]}`;

    // Create Date and time
    const now = new Date();
    const option = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    labelDate.textContent = new Intl.DateTimeFormat(
      currentAccount.locale,
      option
    ).format(now);

    // Logout Timer
    if (timer) clearInterval(timer); // Clears timer if it's alresady present
    timer = logOutTimer();

    // Update UI
    updateUI(currentAccount);

    // Clear Input fields
    inputLoginUsername.value = inputLoginPin.value = '';
    inputLoginPin.blur();

    sorted = false;
  }
});

// Implementing transfers
btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();

  const receiverAccount = accounts.find(
    acc => inputTransferTo.value === acc.userName
  );
  const amount = +inputTransferAmount.value;

  if (
    amount > 0 &&
    amount <= currentAccount.balance &&
    receiverAccount &&
    receiverAccount.userName !== currentAccount.userName
  ) {
    // Transfer amount
    currentAccount.movsWithDates.push([-amount, new Date().toISOString()]);
    receiverAccount.movsWithDates.push([amount, new Date().toISOString()]);

    // Update UI
    updateUI(currentAccount);

    // Clear Input fields
    inputTransferTo.value = inputTransferAmount.value = '';
    inputTransferAmount.blur();

    // Reset Timer
    clearInterval(timer);
    timer = logOutTimer();
  }
});

// Request Loan
btnLoan.addEventListener('click', function (e) {
  e.preventDefault();

  const amount = +inputLoanAmount.value;

  if (
    amount > 0 &&
    currentAccount.movsWithDates.some(mov => mov[0] >= amount * 0.1)
  ) {
    // Grant Loan
    currentAccount.movsWithDates.push([amount, new Date().toISOString()]);

    // Update UI
    setTimeout(function () {
      updateUI(currentAccount);
    }, 3000);

    // Clear Input field
    inputLoanAmount.value = '';
    inputLoanAmount.blur();

    // Reset Timer
    clearInterval(timer);
    timer = logOutTimer();
  }
});

// Close Account
btnClose.addEventListener('click', function (e) {
  e.preventDefault();

  if (
    inputCloseUsername.value === currentAccount.userName &&
    +inputClosePin.value === currentAccount.pin
  ) {
    // finding account Index
    const index = accounts.findIndex(
      acc => acc.userName === currentAccount.userName
    );

    // Removing account
    accounts.splice(index, 1);

    // Clear Input fields
    inputCloseUsername.value = inputClosePin.value = '';
    inputClosePin.blur();

    // Hiding UI and Message
    containerApp.style.opacity = 0;
    labelWelcome.textContent = 'Login to get started';
  }
});

let sorted = false;
// Sorting
btnSort.addEventListener('click', function () {
  displayMovements(currentAccount, !sorted);
  sorted = !sorted;
});
