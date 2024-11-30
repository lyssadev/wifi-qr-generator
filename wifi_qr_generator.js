const QRCode = require('qrcode');

function generateWifiQR(ssid, password, encryption = 'WPA') {
    const wifiConfig = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
    QRCode.toFile('wifi_qr.png', wifiConfig, function (err) {
        if (err) throw err;
        console.log("QR code generated and saved as 'wifi_qr.png'.");
    });
}

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Enter Wi-Fi SSID: ', (ssid) => {
    readline.question('Enter Wi-Fi Password: ', (password) => {
        readline.question('Enter Encryption Type (WPA/WEP/nopass): ', (encryption) => {
            generateWifiQR(ssid, password, encryption);
            readline.close();
        });
    });
});
