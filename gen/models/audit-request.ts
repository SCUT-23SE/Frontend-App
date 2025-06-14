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
 * @interface AuditRequest
 */
export interface AuditRequest {
    /**
     * 审核申请ID
     * @type {number}
     * @memberof AuditRequest
     */
    auditRequestId?: number;
    /**
     * 签到任务ID
     * @type {number}
     * @memberof AuditRequest
     */
    taskId?: number;
    /**
     * 签到任务名称
     * @type {string}
     * @memberof AuditRequest
     */
    taskName?: string;
    /**
     * 申请用户ID
     * @type {number}
     * @memberof AuditRequest
     */
    userId?: number;
    /**
     * 申请用户名
     * @type {string}
     * @memberof AuditRequest
     */
    username?: string;
    /**
     * 申请原因
     * @type {string}
     * @memberof AuditRequest
     */
    reason?: string;
    /**
     * 证明材料图片URL
     * @type {string}
     * @memberof AuditRequest
     */
    proofImageUrls?: string;
    /**
     * 审核状态
     * @type {string}
     * @memberof AuditRequest
     */
    status?: AuditRequestStatusEnum;
    /**
     * 申请时间（Unix时间戳，单位：秒）
     * @type {number}
     * @memberof AuditRequest
     */
    requestedAt?: number;
    /**
     * 处理管理员ID
     * @type {number}
     * @memberof AuditRequest
     */
    adminId?: number;
    /**
     * 处理管理员用户名
     * @type {string}
     * @memberof AuditRequest
     */
    adminUsername?: string;
    /**
     * 处理时间（Unix时间戳，单位：秒）
     * @type {number}
     * @memberof AuditRequest
     */
    processedAt?: number;
}

/**
    * @export
    * @enum {string}
    */
export enum AuditRequestStatusEnum {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected'
}



