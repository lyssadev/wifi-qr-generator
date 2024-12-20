var QRCode = require('qrcode');
var readline = require('readline');
var fs = require('fs');
var exec = require('child_process').exec;

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        crimson: "\x1b[38m" // Scarlet
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};

function validateInput(input, type) {
    if (!input || input.trim() === '') {
        return new Error(type + ' cannot be empty');
    }
    if (type === 'encryption') {
        var validTypes = ['WPA', 'WEP', 'nopass'];
        var found = validTypes.includes(input.toUpperCase());
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
        console.error(colors.fg.red + 'Error:', validationError.message + colors.reset);
        return;
    }
    
    validationError = validateInput(password, 'Password');
    if (validationError) {
        console.error(colors.fg.red + 'Error:', validationError.message + colors.reset);
        return;
    }
    
    encryption = encryption || 'WPA';
    validationError = validateInput(encryption, 'Encryption');
    if (validationError) {
        console.error(colors.fg.red + 'Error:', validationError.message + colors.reset);
        return;
    }

    var filename = 'wifi_' + getTimestamp() + '.png';
    var wifiString = 'WIFI:S:' + ssid + ';T:' + encryption.toUpperCase() + ';P:' + password + ';;';

    QRCode.toFile(filename, wifiString, function(err) {
        if (err) {
            console.error(colors.fg.red + 'Error generating QR code:', err.message + colors.reset);
            return;
        }
        console.log(colors.fg.green + '\nSuccess! QR code saved as: ' + filename + colors.reset);
        console.log(colors.fg.cyan + 'File location: ' + process.cwd() + '/' + filename + colors.reset);
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

// New function to list networks using non-root methods
function listNetworks(callback) {
    var commands = [
        'nmcli -t -f active,ssid dev wifi',
        'iw dev wlan0 scan | grep SSID',
        'iwconfig wlan0 | grep ESSID',
        'iw wlan0 link',
        'iw dev wlan0 station dump',
        'iwlist wlan0 scan | grep ESSID',
        'iwlist wlan0 scan | grep Quality',
        'iwlist wlan0 scan | grep Frequency',
        'iwlist wlan0 scan | grep Channel',
        'iwlist wlan0 scan | grep Mode',
        'iwlist wlan0 scan | grep Cell',
        'iwlist wlan0 scan | grep Address',
        'iwlist wlan0 scan | grep Signal',
        'iwlist wlan0 scan | grep Noise',
        'iwlist wlan0 scan | grep Encryption',
        'iwlist wlan0 scan | grep Bit Rates',
        'iwlist wlan0 scan | grep WPA',
        'iwlist wlan0 scan | grep WEP',
        'iwlist wlan0 scan | grep IEEE'
    ];

    var results = [];
    var completed = 0;

    commands.forEach(command => {
        exec(command, function(error, stdout, stderr) {
            if (!error) {
                var networks = stdout.split('\n').map(line => line.trim().replace(/"/g, ''));
                results.push(...networks);
            }
            completed++;
            if (completed === commands.length) {
                callback(results);
            }
        });
    });
}

function showNetworkSelection(networks) {
    console.log(colors.fg.cyan + '\nSaved networks found:');
    console.log('-------------------' + colors.reset);
    
    for (var i = 0; i < networks.length; i++) {
        console.log(colors.fg.yellow + (i + 1) + ') ' + networks[i].ssid + colors.reset);
    }
    console.log(colors.fg.yellow + '0) Manual entry' + colors.reset);
    console.log(colors.fg.cyan + '-------------------\n' + colors.reset);
    
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(colors.fg.green + 'Select network number: ' + colors.reset, function(choice) {
        var num = parseInt(choice);
        if (num === 0) {
            rl.close();
            startManualEntry();
        } else if (num > 0 && num <= networks.length) {
            var selected = networks[num - 1];
            generateWifiQR(selected.ssid, selected.password, selected.encryption);
            rl.close();
        } else {
            console.log(colors.fg.red + '\nInvalid selection. Starting manual entry...\n' + colors.reset);
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

    console.log(colors.fg.magenta + '\nManual WiFi QR Code Generation');
    console.log('----------------------------\n' + colors.reset);

    rl.question(colors.fg.green + 'WiFi name (SSID): ' + colors.reset, function(ssid) {
        rl.question(colors.fg.green + 'WiFi password: ' + colors.reset, function(password) {
            rl.question(colors.fg.green + 'Security type (WPA/WEP/nopass) [WPA]: ' + colors.reset, function(encryption) {
                encryption = encryption || 'WPA';
                generateWifiQR(ssid, password, encryption);
                rl.close();
            });
        });
    });
}

// Main program
console.log(colors.fg.magenta + '\nWiFi QR Code Generator');
console.log('====================\n' + colors.reset);

function listAndSelectNetworks() {
    listNetworks(function(networks) {
        if (networks && networks.length > 0) {
            console.log(colors.fg.cyan + '\nAvailable networks:');
            console.log('-------------------' + colors.reset);
            for (var i = 0; i < networks.length; i++) {
                console.log(colors.fg.yellow + (i + 1) + ') ' + networks[i] + colors.reset);
            }
            console.log(colors.fg.yellow + '0) Manual entry' + colors.reset);
            console.log(colors.fg.cyan + '-------------------\n' + colors.reset);

            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            rl.question(colors.fg.green + 'Select network number: ' + colors.reset, function(choice) {
                var num = parseInt(choice);
                if (num === 0) {
                    rl.close();
                    startManualEntry();
                } else if (num > 0 && num <= networks.length) {
                    var selected = networks[num - 1];
                    rl.question(colors.fg.green + 'WiFi password: ' + colors.reset, function(password) {
                        generateWifiQR(selected, password, 'WPA');
                        rl.close();
                    });
                } else {
                    console.log(colors.fg.red + '\nInvalid selection. Starting manual entry...\n' + colors.reset);
                    rl.close();
                    startManualEntry();
                }
            });
        } else {
            console.log(colors.fg.red + 'No available networks found. Starting manual entry...\n' + colors.reset);
            startManualEntry();
        }
    });
}

listAndSelectNetworks();