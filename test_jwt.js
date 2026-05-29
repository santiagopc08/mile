const jwt = require('jsonwebtoken');
const token = jwt.sign({
    role: 'authenticated',
    sub: 'el',
    profile: 'el'
}, 'dummy_secret');
console.log(token);
