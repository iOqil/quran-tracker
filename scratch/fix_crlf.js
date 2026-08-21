const fs = require('fs');
const content = fs.readFileSync('client/android/gradlew', 'utf8');
if (content.includes('\r\n')) {
    console.log('CRLF line endings found!');
    fs.writeFileSync('client/android/gradlew', content.replace(/\r\n/g, '\n'), 'utf8');
    console.log('Fixed to LF');
} else {
    console.log('LF line endings found (already correct).');
}
