var QRCode = require('qrcode');
var readline = require('readline');
var fs = require('fs');
var exec = require('child_process').exec;

function validateInput(input, type) {
    if (!input || input.trim() === '') {
        return new Error(type + ' cannot be empty');
    }
    if (type === 'encryption') {
        var validTypes = ['WPA', 'WEP', 'nopass'];
        var found = false;
        for (var i = 0; i < validTypes.length; i++) {
            if (validTypes[i] === input.toUpperCase()) {
                found = true;
                break;
            }
        }
        if (!found) {
            return new Error('Invalid encryption type. Use WPA, WEP, or nopass');
        }
    }
    return null;
}

function getTimestamp() {
    var d = new Date();
    var year = d.getFullYear();
    var month = (d.getMonth() + 1);
    var day = d.getDate();
    var hour = d.getHours();
    var minute = d.getMinutes();
    
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    if (hour < 10) hour = '0' + hour;
    if (minute < 10) minute = '0' + minute;
    
    return '' + year + month + day + '_' + hour + minute;
}

function generateWifiQR(ssid, password, encryption) {
    var validationError;
    
    validationError = validateInput(ssid, 'SSID');
    if (validationError) {
        console.error('Error:', validationError.message);
        return;
    }
    
    validationError = validateInput(password, 'Password');
    if (validationError) {
        console.error('Error:', validationError.message);
        return;
    }
    
    encryption = encryption || 'WPA';
    validationError = validateInput(encryption, 'Encryption');
    if (validationError) {
        console.error('Error:', validationError.message);
        return;
    }

    var filename = 'wifi_' + getTimestamp() + '.png';
    var wifiString = 'WIFI:S:' + ssid + ';T:' + encryption.toUpperCase() + ';P:' + password + ';;';

    QRCode.toFile(filename, wifiString, function(err) {
        if (err) {
            console.error('Error generating QR code:', err.message);
            return;
        }
        console.log('');
        console.log('Success! QR code saved as: ' + filename);
        console.log('File location: ' + process.cwd() + '/' + filename);
        console.log('');
    });
}

function parseNetworks(configContent) {
    var networks = [];
    var lines = configContent.split('\n');
    var currentNetwork = null;
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        
        if (line === 'network={') {
            currentNetwork = {};
        }
        else if (line === '}' && currentNetwork) {
            if (currentNetwork.ssid && currentNetwork.psk) {
                networks.push({
                    ssid: currentNetwork.ssid,
                    password: currentNetwork.psk,
                    encryption: 'WPA'
                });
            }
            currentNetwork = null;
        }
        else if (currentNetwork) {
            if (line.indexOf('ssid=') === 0) {
                currentNetwork.ssid = line.substring(6, line.length - 1);
            }
            else if (line.indexOf('psk=') === 0) {
                currentNetwork.psk = line.substring(5, line.length - 1);
            }
        }
    }
    
    return networks;
}

function tryReadWifiConfig(callback) {
    var command = 'sudo cat /etc/wpa_supplicant/wpa_supplicant.conf';
    
    exec(command, function(error, stdout, stderr) {
        if (error) {
            callback(null);
            return;
        }
        
        try {
            var networks = parseNetworks(stdout);
            callback(networks);
        } catch (err) {
            callback(null);
        }
    });
}

function listAvailableNetworks(callback) {
    var command = 'sudo iwlist wlan0 scan | grep ESSID';
    
    exec(command, function(error, stdout, stderr) {
        if (error) {
            callback(null);
            return;
        }
        
        try {
            var networks = stdout.split('\n').map(line => line.trim().replace('ESSID:', '').replace(/"/g, ''));
            callback(networks);
        } catch (err) {
            callback(null);
        }
    });
}

function showNetworkSelection(networks) {
    console.log('\nSaved networks found:');
    console.log('-------------------');
    
    for (var i = 0; i < networks.length; i++) {
        console.log((i + 1) + ') ' + networks[i].ssid);
    }
    console.log('0) Manual entry');
    console.log('-------------------\n');
    
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Select network number: ', function(choice) {
        var num = parseInt(choice);
        if (num === 0) {
            rl.close();
            startManualEntry();
        } else if (num > 0 && num <= networks.length) {
            var selected = networks[num - 1];
            generateWifiQR(selected.ssid, selected.password, selected.encryption);
            rl.close();
        } else {
            console.log('\nInvalid selection. Starting manual entry...\n');
            rl.close();
            startManualEntry();
        }
    });
}

function startManualEntry() {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('\nManual WiFi QR Code Generation');
    console.log('----------------------------\n');

    rl.question('WiFi name (SSID): ', function(ssid) {
        rl.question('WiFi password: ', function(password) {
            rl.question('Security type (WPA/WEP/nopass) [WPA]: ', function(encryption) {
                encryption = encryption || 'WPA';
                generateWifiQR(ssid, password, encryption);
                rl.close();
            });
        });
    });
}

// Main program
console.log('\nWiFi QR Code Generator');
console.log('====================\n');

function listAndSelectNetworks() {
    listAvailableNetworks(function(networks) {
        if (networks && networks.length > 0) {
            console.log('\nAvailable networks:');
            console.log('-------------------');
            for (var i = 0; i < networks.length; i++) {
                console.log((i + 1) + ') ' + networks[i]);
            }
            console.log('0) Manual entry');
            console.log('-------------------\n');

            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question('Select network number: ', function(choice) {
                var num = parseInt(choice);
                if (num === 0) {
                    rl.close();
                    startManualEntry();
                } else if (num > 0 && num <= networks.length) {
                    var selected = networks[num - 1];
                    rl.question('WiFi password: ', function(password) {
                        generateWifiQR(selected, password, 'WPA');
                        rl.close();
                    });
                } else {
                    console.log('\nInvalid selection. Starting manual entry...\n');
                    rl.close();
                    startManualEntry();
                }
            });
        } else {
            console.log('No available networks found. Starting manual entry...\n');
            startManualEntry();
        }
    });
}

listAndSelectNetworks();
