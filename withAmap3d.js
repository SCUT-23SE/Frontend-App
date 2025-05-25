const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const path = require('path');

// 高德地图 SDK 需要的主要权限
const MAP_PERMISSIONS = [
    'android.permission.INTERNET', // 允许程序打开网络套接字
    'android.permission.ACCESS_NETWORK_STATE', // 允许程序访问有关网络的信息
    'android.permission.ACCESS_WIFI_STATE', // 允许程序访问Wi-Fi网络状态信息
    'android.permission.ACCESS_COARSE_LOCATION', // 允许程序通过WiFi或移动基站的方式获取用户粗略的地理位置信息
    'android.permission.ACCESS_FINE_LOCATION', // 允许程序通过GPS芯片接收卫星的定位信息
    'android.permission.CHANGE_WIFI_STATE', // 允许程序改变Wi-Fi连接状态
];

// 处理 AndroidManifest.xml 的修改
function applyAndroidManifestModifications(config, apiKey) {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        let application = androidManifest.manifest.application?.[0];

        if (!application) {
            console.warn('withAmap3d: <application> tag not found in AndroidManifest.xml.');
            return config;
        }
        if (!application.$) {
            application.$ = {};
        }

        // 添加allowNativeHeapPointerTagging属性设置为false，解决部分设备返回地图页面闪退问题
        application.$['android:allowNativeHeapPointerTagging'] = 'false';
        console.log('withAmap3d: Added android:allowNativeHeapPointerTagging="false" to fix map crash issue');

        // 添加高德 API Key (确保与 withAmapGeolocation 插件不冲突或覆盖，如果后者也添加的话)
        // 最好只在一个地方添加 API Key，或者确保它们添加的是同一个 Key。
        // 此处代码会移除已存在的同名meta-data再添加，确保只有一个。
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
        console.log('withAmap3d: Ensured AMap API Key is present in AndroidManifest.xml');

        // react-native-amap3d 初始化时会处理隐私合规，这里不需要额外添加服务声明，
        // APSService 应该由 react-native-amap-geolocation 的插件 (withAmapGeolocation.js) 添加。
        // 如果 withAmapGeolocation.js 未添加 APSService, 而 react-native-amap3d 的 SdkModule.kt 又调用了 AMapLocationClient,
        // 则可能需要在此处或 withAmapGeolocation.js 中确保 APSService 的声明。
        // 从您提供的 withAmapGeolocation.js 看，它已经添加了 APSService，所以这里不再重复。

        return config;
    });
}

// 主函数：整合所有修改
const withAmap3d = (config, props) => {
    const { apiKey } = props || {};

    if (!apiKey) {
        console.warn('withAmap3d: apiKey is missing from plugin props. Skipping Android configuration.');
        return config;
    }

    // 1. 添加权限
    config = AndroidConfig.Permissions.withPermissions(config, MAP_PERMISSIONS);
    console.log('withAmap3d: Applied map permissions.');

    // 2. 修改 AndroidManifest.xml
    config = applyAndroidManifestModifications(config, apiKey);

    // 3. 修改 app/build.gradle，添加关键的配置以解决依赖冲突
    config = withDangerousMod(config, [
        'android',
        async (modConfig) => {
            const gradleFilePath = path.join(modConfig.modRequest.platformProjectRoot, 'app', 'build.gradle');
            let buildGradleContent = fs.readFileSync(gradleFilePath, 'utf8');

            // 添加 react-native-amap3d 依赖
            const amap3dDependency = `    implementation project(':react-native-amap3d')`;
            if (!buildGradleContent.includes(amap3dDependency) && !buildGradleContent.includes("project(\":react-native-amap3d\")")) {
                buildGradleContent = mergeContents({
                    src: buildGradleContent,
                    newSrc: amap3dDependency,
                    anchor: /dependencies\s*\{/,
                    offset: 1, // 在 dependencies { 之后插入
                    tag: 'react-native-amap3d-gradle-dependency',
                    comment: '//',
                }).contents;
                console.log('withAmap3d: Added react-native-amap3d gradle dependency');
            } else {
                console.log('withAmap3d: react-native-amap3d gradle dependency already exists.');
            }

            // 添加 kotlin 标准库依赖 (如果项目中还没有)
            // Expo 默认项目通常已经配置好了 Kotlin。$kotlinVersion 通常在根 build.gradle 中定义。
            const kotlinStdlibDependency = 'implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlinVersion"'; // Expo 通常用 $kotlinVersion
            if (!buildGradleContent.includes('kotlin-stdlib')) { // 检查是否已存在 kotlin-stdlib 或 kotlin-stdlib-jdkX
                buildGradleContent = mergeContents({
                    src: buildGradleContent,
                    newSrc: `    ${kotlinStdlibDependency}`,
                    anchor: /dependencies\s*\{/,
                    offset: 1, // 在 dependencies { 之后插入
                    tag: 'kotlin-stdlib-dependency',
                    comment: '//',
                }).contents;
                console.log('withAmap3d: Added kotlin-stdlib-jdk7 dependency using $kotlinVersion.');
            } else {
                console.log('withAmap3d: kotlin-stdlib dependency already exists, skipping.');
            }

            // 关键部分: 添加 configurations.all 块以解决依赖冲突
            // 这会告诉 Gradle 在解析依赖时排除 com.amap.api:location 库，使用 3dmap 中的实现
            const configurationsBlock = `
// @generated begin amap-dependency-fix - expo prebuild (DO NOT MODIFY)
configurations.all {
    resolutionStrategy {
        // 优先使用高德3D SDK中的定位功能
        force 'com.amap.api:3dmap:9.6.0'
        // 排除高德定位 SDK，因为它与3D SDK中的类冲突
        exclude group: 'com.amap.api', module: 'location'
    }
}
// @generated end amap-dependency-fix
`;

            if (!buildGradleContent.includes('exclude group: \'com.amap.api\', module: \'location\'')) {
                // 插入到 android { 块之后，这样它会应用于所有配置
                buildGradleContent = mergeContents({
                    src: buildGradleContent,
                    newSrc: configurationsBlock,
                    anchor: /android\s*\{/,
                    offset: 1,
                    tag: 'amap-dependency-fix',
                    comment: '//',
                }).contents;
                console.log('withAmap3d: Added configurations block to resolve dependency conflicts');
            } else {
                console.log('withAmap3d: Dependency conflict resolution already exists');
            }

            fs.writeFileSync(gradleFilePath, buildGradleContent, 'utf8');
            console.log('withAmap3d: Updated app/build.gradle');

            return modConfig;
        },
    ]);

    return config;
};

module.exports = withAmap3d;