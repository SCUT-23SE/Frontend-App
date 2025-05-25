import { initAMapLocation } from './location';

// 初始化所有需要的服务
export async function initServices() {
  // 初始化高德地图定位SDK
  await initAMapLocation();

  // 其他服务初始化可以在这里添加
}
