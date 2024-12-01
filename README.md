# Wi-Fi QR Code Generator

A simple command-line tool that generates QR codes for sharing Wi-Fi credentials securely. Designed to run in Termux on Android devices using Node.js.

## Description

The Wi-Fi QR Code Generator creates QR codes containing your Wi-Fi network details. When someone scans the generated QR code with their phone's camera, they can connect to your Wi-Fi network automatically without typing the password.

## Installation

1. Make sure Node.js is installed in Termux:
   ```bash
   pkg install nodejs
   ```

2. Install the required QR code package:
   ```bash
   npm install qrcode
   ```

## Usage

1. Run the program:
   ```bash
   node wifi_qr_generator.js
   ```

2. Follow the prompts to enter:
   - WiFi name (SSID)
   - WiFi password
   - Security type (WPA/WEP/nopass)

3. The QR code will be saved as a PNG file in your current directory
   - Filename format: wifi_YYYYMMDD_HHMM.png
   - Example: wifi_20240215_1430.png

## Notes

- The generated QR code can be scanned by most modern phone cameras
- For security, delete the QR code file after sharing
- Works with WPA, WEP, and open networks (nopass)
