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



/**
 * 
 * @export
 * @interface JoinRequest
 */
export interface JoinRequest {
    /**
     * 申请ID
     * @type {number}
     * @memberof JoinRequest
     */
    requestId?: number;
    /**
     * 用户组ID
     * @type {number}
     * @memberof JoinRequest
     */
    groupId?: number;
    /**
     * 申请用户ID
     * @type {number}
     * @memberof JoinRequest
     */
    userId?: number;
    /**
     * 申请用户名
     * @type {string}
     * @memberof JoinRequest
     */
    username?: string;
    /**
     * 申请状态
     * @type {string}
     * @memberof JoinRequest
     */
    status?: JoinRequestStatusEnum;
    /**
     * 申请时间（Unix时间戳，单位：秒）
     * @type {number}
     * @memberof JoinRequest
     */
    requestedAt?: number;
}

/**
    * @export
    * @enum {string}
    */
export enum JoinRequestStatusEnum {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected'
}



