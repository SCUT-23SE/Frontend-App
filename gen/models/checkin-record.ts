// tslint:disable
/**
 * 实训打卡
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import { CheckinMethods } from './checkin-methods';
import { CheckinRecordLocationInfo } from './checkin-record-location-info';

/**
 * 签到记录，包含任务基本信息和签到信息。只包含成功签到的记录。
 * @export
 * @interface CheckinRecord
 */
export interface CheckinRecord {
    /**
     * 签到记录ID
     * @type {number}
     * @memberof CheckinRecord
     */
    recordId: number;
    /**
     * 签到任务ID
     * @type {number}
     * @memberof CheckinRecord
     */
    taskId: number;
    /**
     * 签到任务名称
     * @type {string}
     * @memberof CheckinRecord
     */
    taskName: string;
    /**
     * 用户组ID
     * @type {number}
     * @memberof CheckinRecord
     */
    groupId: number;
    /**
     * 用户组名称
     * @type {string}
     * @memberof CheckinRecord
     */
    groupName: string;
    /**
     * 签到用户ID
     * @type {number}
     * @memberof CheckinRecord
     */
    userId: number;
    /**
     * 签到用户名
     * @type {string}
     * @memberof CheckinRecord
     */
    username: string;
    /**
     * 实际签到时间（Unix时间戳，单位：秒）
     * @type {number}
     * @memberof CheckinRecord
     */
    signedTime?: number;
    /**
     * 签到信息
     * @type {string}
     * @memberof CheckinRecord
     */
    message?: string;
    /**
     * 
     * @type {CheckinMethods}
     * @memberof CheckinRecord
     */
    checkinMethods: CheckinMethods;
    /**
     * 
     * @type {CheckinRecordLocationInfo}
     * @memberof CheckinRecord
     */
    locationInfo?: CheckinRecordLocationInfo;
    /**
     * 创建时间（Unix时间戳，单位：秒）
     * @type {number}
     * @memberof CheckinRecord
     */
    createdAt?: number;
}


