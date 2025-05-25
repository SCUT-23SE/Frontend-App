import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as AMapGeolocation from 'react-native-amap-geolocation';

// 定义位置信息接口
export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  streetNumber?: string;
  poiName?: string;
}

// 检查AMapGeolocation初始化方法是否可用
const isAMapGeolocationAvailable =
  AMapGeolocation && typeof AMapGeolocation.init === 'function';

// 从NativeModules获取原生模块
const nativeAMapGeolocation = NativeModules.AMapGeolocation;

// 初始化高德地图定位SDK
export async function initAMapLocation() {
  if (Platform.OS === 'android') {
    try {
      // 从环境变量获取高德地图AppKey
      const amapKey = Constants.expoConfig?.extra?.amap?.android;

      if (!amapKey) {
        console.error('缺少高德地图AppKey，请在app.json中配置');
        return false;
      }

      // 检查模块是否可用
      if (!isAMapGeolocationAvailable) {
        console.warn('高德地图定位SDK的init方法不可用，尝试其他方式初始化');

        // 尝试使用原生模块
        if (
          nativeAMapGeolocation &&
          typeof nativeAMapGeolocation.init === 'function'
        ) {
          await nativeAMapGeolocation.init({
            android: amapKey,
          });
          console.log('使用原生模块初始化高德地图定位SDK成功');
          return true;
        } else {
          console.error('高德地图定位SDK不可用，位置功能将受限');
          return false;
        }
      }

      // 使用常规方式初始化
      await AMapGeolocation.init({
        ios: 'ios_key_placeholder', // 虽然不使用iOS，但API需要这个字段
        android: amapKey,
      });

      // 设置定位参数
      if (typeof AMapGeolocation.setDistanceFilter === 'function') {
        AMapGeolocation.setDistanceFilter(10); // 设置定位距离过滤，单位：米
      }

      // 启用返回地址信息 (Android)
      if (typeof AMapGeolocation.setNeedAddress === 'function') {
        AMapGeolocation.setNeedAddress(true);
      }

      if (typeof AMapGeolocation.setOnceLocation === 'function') {
        AMapGeolocation.setOnceLocation(false); // 是否只定位一次
      }

      console.log('高德地图定位SDK初始化成功');
      return true;
    } catch (error) {
      console.error('高德地图定位SDK初始化失败:', error);
      return false;
    }
  }
  return false;
}

// 获取当前位置
export async function getCurrentLocation(): Promise<LocationInfo> {
  try {
    // 使用高德地图定位
    if (Platform.OS === 'android') {
      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('位置权限被拒绝');
      }

      // 检查高德定位模块是否可用
      if (!isAMapGeolocationAvailable || !AMapGeolocation.start) {
        console.warn('高德地图定位SDK不可用，回退到Expo Location');

        // 回退到使用Expo Location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (location) {
          return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };
        } else {
          throw new Error('无法获取位置信息');
        }
      }

      // 使用高德定位SDK获取位置
      return new Promise<LocationInfo>((resolve, reject) => {
        try {
          // 添加定位监听器
          const listener = AMapGeolocation.addLocationListener((location) => {
            // 移除监听器
            listener?.remove?.();

            if (location && location.latitude && location.longitude) {
              // 构建完整的地址字符串
              let address = '';
              if (location.address) {
                address = location.address;
              } else {
                // 如果没有完整地址，则从各个部分组合
                const addressParts = [
                  location.province,
                  location.city,
                  location.district,
                  location.street,
                  location.streetNumber,
                  location.poiName ? `(${location.poiName})` : '',
                ].filter(Boolean);
                address = addressParts.join('');
              }

              resolve({
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                timestamp: location.timestamp,
                address: address,
                province: location.province,
                city: location.city,
                district: location.district,
                street: location.street,
                streetNumber: location.streetNumber,
                poiName: location.poiName,
              });
            } else {
              reject(new Error('获取位置信息失败'));
            }
          });

          // 设置为单次定位
          if (typeof AMapGeolocation.setOnceLocation === 'function') {
            AMapGeolocation.setOnceLocation(true);
          }

          // 开始定位
          AMapGeolocation.start();

          // 设置超时
          setTimeout(() => {
            listener?.remove?.();
            if (typeof AMapGeolocation.stop === 'function') {
              AMapGeolocation.stop();
            }
            reject(new Error('获取位置超时'));
          }, 15000); // 15秒超时
        } catch (error) {
          reject(error);
        }
      });
    } else {
      throw new Error('当前平台不支持');
    }
  } catch (error) {
    console.error('获取位置失败:', error);
    throw new Error('无法获取位置信息，请检查定位权限和网络连接');
  }
}

// 计算两个坐标点之间的距离（米）
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 地球半径，单位：米
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d;
}

// 检查位置是否在指定范围内
export function isLocationInRange(
  currentLat: number,
  currentLon: number,
  targetLat: number,
  targetLon: number,
  radiusInMeters: number
): boolean {
  const distance = calculateDistance(
    currentLat,
    currentLon,
    targetLat,
    targetLon
  );
  return distance <= radiusInMeters;
}

// 根据经纬度获取地址信息
export async function getLocationAddress(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      // 设置返回地址信息
      AMapGeolocation.setNeedAddress(true);

      // 设置定位是否返回逆地理编码
      if (AMapGeolocation.setLocatingWithReGeocode) {
        AMapGeolocation.setLocatingWithReGeocode(true);
      }

      return new Promise<string>((resolve, reject) => {
        // 添加定位监听器
        const listener = AMapGeolocation.addLocationListener((location) => {
          // 移除监听器
          listener.remove();
          AMapGeolocation.stop();

          if (location && location.address) {
            resolve(location.address);
          } else {
            // 如果没有完整地址，则从各个部分组合
            const addressParts = [
              location.province,
              location.city,
              location.district,
              location.street,
              location.streetNumber,
              location.poiName ? `(${location.poiName})` : '',
            ].filter(Boolean);

            const address = addressParts.join('');
            if (address) {
              resolve(address);
            } else {
              resolve(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
            }
          }
        });

        // 设置为单次定位
        AMapGeolocation.setOnceLocation(true);

        // 开始定位
        AMapGeolocation.start();

        // 设置超时
        setTimeout(() => {
          listener.remove();
          AMapGeolocation.stop();
          // 如果超时，返回经纬度作为地址
          resolve(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
        }, 5000); // 5秒超时
      });
    } else {
      // 如果不是Android平台，返回经纬度作为地址
      return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    }
  } catch (error) {
    console.error('获取地址信息失败:', error);
    // 出错时返回经纬度作为地址
    return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  }
}
