const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// 1. Remove user & csrfToken
let stateReg = /user:\s*null,\s*csrfToken:\s*null/;
content = content.replace(stateReg, '');

// 2. Remove initAuth() call
content = content.replace(/\/\/ Auth is initialized last but checks immediately\r?\n\s*initAuth\(\);/, '');

// 3. Remove from initAuth() up to Location Modal
const authStart = content.indexOf('// ==========================================\r\n    // Auth System & Secure Data');
if (authStart === -1) {
    const fallbackAuthStart = content.indexOf('// ==========================================\n    // Auth System & Secure Data');
    if (fallbackAuthStart !== -1) {
        const authEnd = content.indexOf('// ==========================================\n    // Location Modal');
        if (authEnd !== -1) {
            content = content.slice(0, fallbackAuthStart) + content.slice(authEnd);
        }
    }
} else {
    const authEnd = content.indexOf('// ==========================================\r\n    // Location Modal');
    if (authEnd !== -1) {
        content = content.slice(0, authStart) + content.slice(authEnd);
    }
}

// 4. Update initLocationModal body
content = content.replace(/if \(!savedGov\) \{[\s\S]*?\} else \{/, `if (!savedGov) {
            document.body.classList.add('location-required');
            modal.classList.add('active');
        } else {`);

content = content.replace(/modal\.classList\.remove\('active'\);/, `modal.classList.remove('active');
                document.body.classList.remove('location-required');`);

content = content.replace(/changeBtn\.addEventListener\('click', \(\) => \{[\s\S]*?modal\.classList\.add\('active'\);[\s\S]*?\}\);/, `changeBtn.addEventListener('click', () => {
                document.body.classList.add('location-required');
                modal.classList.add('active');
            });`);


fs.writeFileSync(filePath, content, 'utf8');
console.log('app.js updated successfully!');
