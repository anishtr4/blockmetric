const UAParser = require('ua-parser-js');

function parseUserAgent(userAgent) {
    if (!userAgent) {
        return {
            deviceType: 'Unknown',
            browser: 'Unknown',
            os: 'Unknown'
        };
    }

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let deviceType = 'Desktop';
    if (result.device.type) {
        switch (result.device.type.toLowerCase()) {
            case 'mobile':
            case 'phone':
                deviceType = 'Mobile';
                break;
            case 'tablet':
                deviceType = 'Tablet';
                break;
            case 'wearable':
                deviceType = 'Wearable';
                break;
            case 'embedded':
                deviceType = 'IoT';
                break;
            default:
                deviceType = 'Desktop';
        }
    }

    return {
        deviceType,
        browser: result.browser.name || 'Unknown',
        os: result.os.name || 'Unknown'
    };
}

module.exports = { parseUserAgent };