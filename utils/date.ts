/**
 * 日期格式化工具函数
 */

/**
 * 将日期格式化为 YYYY-MM-DD HH:mm 格式
 * @param date 日期对象或日期字符串或时间戳
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);

  const year = d.getFullYear();
  // 月份从0开始，需要+1，并且保证两位数格式
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 将Unix时间戳（秒）转换为格式化日期
 * @param timestamp Unix时间戳，单位为秒
 * @returns 格式化后的日期字符串
 */
export function formatUnixTimestamp(timestamp: number): string {
  return formatDate(timestamp * 1000);
}
