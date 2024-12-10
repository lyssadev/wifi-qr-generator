# Wi-Fi QR Code Generator

A simple command-line tool that generates QR codes for sharing Wi-Fi credentials securely. Now compatible with both Android (using Termux) and Linux.

## Description

The Wi-Fi QR Code Generator is a command-line tool designed to generate QR codes for sharing Wi-Fi credentials. It supports both manual entry and automatic detection of saved networks. The tool is now compatible with Linux, providing advanced network search and root access for certain operations.

## Features

- **Manual Entry:** Manually enter the SSID, password, and encryption type to generate a QR code.
- **Saved Networks:** Automatically detect and list saved Wi-Fi networks (requires root access on Linux).
- **Advanced Network Search:** List available Wi-Fi networks and select one to generate a QR code.
- **Linux Compatibility:** The tool now works on both Android (using Termux) and Linux.

## Installation

1. **Node.js:** Ensure Node.js is installed on your system.
2. **Dependencies:** Install the required dependencies by running:
   ```sh
   npm install qrcode
   ```

### Running the Tool

1. **List Available Networks:**
   ```sh
   node wifi_qr_generator.js
   ```
   The tool will list available Wi-Fi networks and prompt you to select one. If no networks are found, it will proceed to manual entry.

2. **Manual Entry:**
   If you choose manual entry, the tool will prompt you to enter the SSID, password, and encryption type.

### Example

```sh
node wifi_qr_generator.js
```

### Notes

- **Root Access:** Some operations, such as reading saved Wi-Fi configurations, may require root access. Use `sudo` when running the tool if necessary.
- **Network Interface:** The tool uses `wlan0` as the default network interface for listing available networks. If your system uses a different interface, you may need to modify the script.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
