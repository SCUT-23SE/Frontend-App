// withAmapGeolocation.js
const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

// 高德定位 SDK 需要的主要权限
const LOCATION_PERMISSIONS = [
    'android.permission.INTERNET', // 允许程序打开网络套接字
    'android.permission.ACCESS_NETWORK_STATE', // 允许程序访问有关网络的信息
    'android.permission.ACCESS_WIFI_STATE', // 允许程序访问Wi-Fi网络状态信息
    'android.permission.ACCESS_COARSE_LOCATION', // 允许程序通过WiFi或移动基站的方式获取用户粗略的地理位置信息
    'android.permission.ACCESS_FINE_LOCATION', // 允许程序通过GPS芯片接收卫星的定位信息
    // 以下权限根据高德官方文档和常见实践添加，请根据实际需要确认是否全部保留
    'android.permission.CHANGE_WIFI_STATE', // 允许程序改变Wi-Fi连接状态，在通过WiFi定位时需要
    'android.permission.READ_PHONE_STATE', // 允许程序访问电话状态，用于获取设备唯一标识（部分高德服务可能需要，较新SDK可能不再强制）
    // 'android.permission.WRITE_EXTERNAL_STORAGE', // 允许程序写入外部存储，用于缓存数据（较新Android版本对外部存储访问有更严格限制，请确认高德SDK是否仍需要）
    'android.permission.ACCESS_LOCATION_EXTRA_COMMANDS', // 允许应用程序访问额外的位置提供程序命令
    // 如果你的应用需要在后台获取位置，并且目标API级别较高，可能需要以下权限
    // 'android.permission.FOREGROUND_SERVICE',
    // 'android.permission.ACCESS_BACKGROUND_LOCATION', // 如果需要后台定位
];

// 这是你现有的处理 AndroidManifest.xml 的函数 (或者直接内联到主函数)
function applyAndroidManifestModifications(config, apiKey) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        let application = androidManifest.manifest.application?.[0];

        if (!application) {
            console.warn('withAmapGeolocation: <application> tag not found in AndroidManifest.xml.');
            return config;
        }
        if (!application.$) {
            application.$ = {};
        }

        // 添加高德 API Key
        if (application['meta-data']) {
            application['meta-data'] = application['meta-data'].filter(
                (item) => item.$['android:name'] !== 'com.amap.api.v2.apikey'
            );
        } else {
            application['meta-data'] = [];
        }
        application['meta-data'].push({
            $: { 'android:name': 'com.amap.api.v2.apikey', 'android:value': apiKey },
        });
        console.log('withAmapGeolocation: Added AMap API Key to AndroidManifest.xml');

        // 添加高德定位服务
        if (application.service) {
            application.service = application.service.filter(
                (item) => item.$['android:name'] !== 'com.amap.api.location.APSService'
            );
        } else {
            application.service = [];
        }
        application.service.push({
            $: { 'android:name': 'com.amap.api.location.APSService' },
        });
        console.log('withAmapGeolocation: Added AMap APSService to AndroidManifest.xml');

        return config;
    });
}

const withAmapGeolocation = (config, props) => {
    const { apiKey } = props || {};

    if (!apiKey) {
        console.warn('withAmapGeolocation: apiKey is missing from plugin props. Skipping Android configuration.');
        return config;
    }

    // 1. 添加权限
    config = AndroidConfig.Permissions.withPermissions(config, LOCATION_PERMISSIONS);
    console.log('withAmapGeolocation: Applied location permissions.');

    // 2. 修改 AndroidManifest.xml
    config = applyAndroidManifestModifications(config, apiKey);

    return config;
};

module.exports = withAmapGeolocation;