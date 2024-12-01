var QRCode = require('qrcode');
var readline = require('readline');

function validateInput(input, type) {
    if (!input || input.trim() === '') {
        throw new Error(type + ' cannot be empty');
    }
    if (type === 'encryption' && !['WPA', 'WEP', 'nopass'].includes(input.toUpperCase())) {
        throw new Error('Invalid encryption type. Use WPA, WEP, or nopass');
    }
    return input.trim();
}

function getTimestamp() {
    var date = new Date();
    return date.getFullYear() + '' + 
           (date.getMonth() + 1) + '' + 
           date.getDate() + '_' + 
           date.getHours() + '' + 
           date.getMinutes();
}

function generateWifiQR(ssid, password, encryption) {
    try {
        ssid = validateInput(ssid, 'SSID');
        password = validateInput(password, 'Password');
        encryption = validateInput(encryption || 'WPA', 'Encryption');
        
        var filename = 'wifi_' + getTimestamp() + '.png';
        var wifiString = 'WIFI:S:' + ssid + ';T:' + encryption.toUpperCase() + ';P:' + password + ';;';

        QRCode.toFile(filename, wifiString, function(err) {
            if (err) {
                console.error('Error generating QR code:', err.message);
                return;
            }
            console.log('QR code saved as: ' + filename);
            console.log('You can find the file in your current directory');
        });
    } catch (err) {
        console.error('Error:', err.message);
    }
}

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askSSID() {
    rl.question('WiFi name (SSID): ', function(ssid) {
        askPassword(ssid);
    });
}

function askPassword(ssid) {
    rl.question('WiFi password: ', function(password) {
        askEncryption(ssid, password);
    });
}

function askEncryption(ssid, password) {
    rl.question('Security type (WPA/WEP/nopass) [WPA]: ', function(encryption) {
        encryption = encryption || 'WPA';
        generateWifiQR(ssid, password, encryption);
        rl.close();
    });
}

console.log('WiFi QR Code Generator');
console.log('----------------------');
askSSID();
