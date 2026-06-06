const webPush = require('web-push');
const keys = webPush.generateVAPIDKeys();
console.log('====================================');
console.log('VAPID KEYS GENERATED:');
console.log('====================================');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY="' + keys.publicKey + '"');
console.log('VAPID_PRIVATE_KEY="' + keys.privateKey + '"');
console.log('====================================');
console.log('Please copy and paste these into your .env.local file.');
