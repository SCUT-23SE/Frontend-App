**1.用户申请入组**
用户流程：用户搜索用户组并申请加入
后端响应：join-req出现一个pending记录
问题1：重复入组申请没有拦截导致500
问题2：在管理员的 /groups/1/join-requests?status=pending 接口中返回空列表。

**2.用户执行签到**
用户流程：用户校验完毕后执行签到
问题：/checkin-tasks/2/checkin 接口没有拦截重复请求导致500

3.
user/me/checkin-record 的接口定义需要调整，实现也需要调整