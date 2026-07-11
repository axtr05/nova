const { format } = require('date-fns');
const d1 = new Date("2026-07-08T07:00:00");
const d2 = new Date("2026-07-08T02:00:00.000Z"); // this is 7:30 AM IST
console.log(format(d1, "yyyy-MM-dd'T'HH:mm:ssXXX"));
console.log(format(d2, "yyyy-MM-dd'T'HH:mm:ssXXX"));
console.log(format(d1, "yyyy-MM-dd'T'HH:mm:ss"));
console.log(format(d2, "yyyy-MM-dd'T'HH:mm:ss"));
