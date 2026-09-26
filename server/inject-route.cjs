const fs = require('fs');
const body = fs.readFileSync('server/route-body.txt', 'utf8');
let content = fs.readFileSync('server/src/routes/admin.ts', 'utf8');

// Find the minimal /users route and replace it with the full body
const start = content.indexOf("adminRouter.get('/users'");
if (start === -1) {
  console.error('Start marker not found');
  process.exit(1);
}
// Find the end of the minimal route (the '})\n' after it)
const end = content.indexOf('\n})\n', start);
if (end === -1) {
  console.error('End marker not found');
  process.exit(1);
}
content = content.substring(0, start) + body + content.substring(end + 3);
fs.writeFileSync('server/src/routes/admin.ts', content, 'utf8');
console.log('Injected route. New length:', content.length);
