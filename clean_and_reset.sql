USE `teamtick`;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `check_application`;
TRUNCATE TABLE `tasks_record`;
TRUNCATE TABLE `join_application`;
TRUNCATE TABLE `group_member`;
TRUNCATE TABLE `tasks`;
TRUNCATE TABLE `groups`;
TRUNCATE TABLE `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- #############################################################################
-- ## 0. 设置密码哈希值 (请务必替换为真实哈希值)
-- #############################################################################
SET @hashed_password = '$2a$10$Nf2jVCwwdQ.Jhnz3Z2x2Le0bkp0mqx5esFwC/xvr6rsOxoKBm8U8G'; -- 例如: '$2b$10$abcdefghijklmnopqrstuv' 等

-- #############################################################################
-- ## 1. 插入用户 (users)
-- ## user_id: 1-cwxh, 2-dol, 3-chy, 4-student1, ..., 9-student6
-- #############################################################################
INSERT INTO `users` (`user_id`, `username`, `password`, `mail`) VALUES
(1, 'cwxh', @hashed_password, '1641233466@qq.com'),
(2, 'dol', @hashed_password, 'dol@example.com'),
(3, 'chy', @hashed_password, 'chy@example.com'),
(4, 'student1', @hashed_password, 'student1@example.com'),
(5, 'student2', @hashed_password, 'student2@example.com'),
(6, 'student3', @hashed_password, 'student3@example.com'),
(7, 'student4', @hashed_password, 'student4@example.com'),
(8, 'student5', @hashed_password, 'student5@example.com'),
(9, 'student6', @hashed_password, 'student6@example.com');

-- #############################################################################
-- ## 2. 插入用户组 (groups)
-- ## group_id: 1-c++实验, 2-uml实验
-- ## cwxh (user_id=1) 为管理员 (creator)
-- #############################################################################
INSERT INTO `groups` (`group_id`, `group_name`, `description`, `creator_id`, `creator_name`, `member_num`) VALUES
(1, 'c++实验', 'C++程序设计实验课程组', 1, 'cwxh', 3), -- 初始成员数预设为3 (cwxh, dol, chy)
(2, 'uml实验', 'UML建模技术实验课程组', 1, 'cwxh', 4); -- 初始成员数预设为4 (cwxh, student1, student2, student3)

-- #############################################################################
-- ## 3. 插入组成员 (group_member)
-- #############################################################################
-- ## 小组1: c++实验 (group_id=1)
INSERT INTO `group_member` (`group_id`, `user_id`, `group_name`, `username`, `role`) VALUES
(1, 1, 'c++实验', 'cwxh', 'admin'),
(1, 2, 'c++实验', 'dol', 'member'),
(1, 3, 'c++实验', 'chy', 'member');

-- ## 小组2: uml实验 (group_id=2)
INSERT INTO `group_member` (`group_id`, `user_id`, `group_name`, `username`, `role`) VALUES
(2, 1, 'uml实验', 'cwxh', 'admin'),
(2, 4, 'uml实验', 'student1', 'member'),
(2, 5, 'uml实验', 'student2', 'member'),
(2, 6, 'uml实验', 'student3', 'member');

-- #############################################################################
-- ## 4. 插入打卡任务 (tasks)
-- #############################################################################

-- ## 任务归属于 小组1: c++实验 (group_id=1)
-- ## Task ID: 1 (过期-GPS), 2 (过期-WiFi), 3 (进行中-Face), 4 (进行中)
INSERT INTO `tasks` (`task_id`, `task_name`, `description`, `group_id`, `start_time`, `end_time`, `latitude`, `longitude`, `radius`, `gps`, `wifi`, `face`, `nfc`, `ssid`, `bssid`) VALUES
(1, 'C++实验1报告提交', '提交第一次C++实验报告', 1, CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 14 DAY)), ' 09:00:00'), CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 8 DAY)), ' 23:59:59'), 34.052200, -118.243700, 100, 1, 0, 0, 0, NULL, NULL),
(2, 'C++实验2代码签到', '第二次C++实验课代码环节签到', 1, CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 7 DAY)), ' 09:00:00'), CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 1 DAY)), ' 23:59:59'), 23.0507, 113.4016, 50, 1, 1, 0, 0, 'Lab_WiFi_CXX', 'AA:BB:CC:11:22:33'),
(3, 'C++期中复习打卡', '参与C++期中复习小组讨论打卡', 1, CONCAT(DATE(NOW()), ' 00:00:00'), CONCAT(DATE(DATE_ADD(NOW(), INTERVAL 6 DAY)), ' 23:59:59'), 23.0507, 113.4016, 50, 1, 0, 1, 0, NULL, NULL),
(4, 'C++项目Alpha阶段', 'Alpha阶段开发每日站会', 1, CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 5 DAY)), ' 00:00:00'), CONCAT(DATE(DATE_ADD(NOW(), INTERVAL 15 DAY)), ' 23:59:59'), 23.0507, 113.4016, 50, 1, 0, 0, 0, NULL, NULL);

-- ## 任务归属于 小组2: uml实验 (group_id=2)
-- ## Task ID: 5 (过期-NFC), 6 (过期), 7 (进行中), 8 (进行中)
INSERT INTO `tasks` (`task_id`, `task_name`, `description`, `group_id`, `start_time`, `end_time`, `latitude`, `longitude`, `radius`, `nfc`, `tagid`, `tagname`, `gps`, `wifi`, `face`) VALUES
(5, 'UML图提交1', '提交第一次UML图作业', 2, CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 14 DAY)), ' 09:00:00'), CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 10 DAY)), ' 23:59:59'), 23.0507, 113.4016, 50, 1, 'UML_NFC_TAG_001', '教室门口NFC点', 1, 0, 0),
(6, 'UML用例分析', '完成用例分析并签到', 2, CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 9 DAY)), ' 09:00:00'), CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 5 DAY)), ' 23:59:59'), 23.0507, 113.4016, 50, 0, NULL, NULL, 1, 0, 0),
(7, 'UML类图设计', '参与UML类图设计讨论打卡', 2, CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 3 DAY)), ' 00:00:00'), CONCAT(DATE(DATE_ADD(NOW(), INTERVAL 4 DAY)), ' 23:59:59'), 23.0507, 113.4016, 50, 0, NULL, NULL, 1, 0, 0),
(8, 'UML序列图练习', '序列图练习签到', 2, CONCAT(DATE(NOW()), ' 00:00:00'), CONCAT(DATE(DATE_ADD(NOW(), INTERVAL 10 DAY)), ' 23:59:59'), 23.0507, 113.4016, 50, 0, NULL, NULL, 1, 0, 0);


-- #############################################################################
-- ## 5. 插入打卡成功记录 (tasks_record) - 针对已过期的任务
-- ## status = 1 表示成功
-- #############################################################################

-- ## 记录针对 Task 1: 'C++实验1报告提交' (task_id=1, group_id=1, group_name='c++实验')
-- ## 成员: dol (user_id=2), chy (user_id=3)
INSERT INTO `tasks_record` (`task_id`, `task_name`, `group_id`, `group_name`, `user_id`, `username`, `signed_time`, `status`, `latitude`, `longitude`) VALUES
(1, 'C++实验1报告提交', 1, 'c++实验', 2, 'dol', CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 12 DAY)), ' 10:00:00'), 1, 34.052000, -118.243500),
(1, 'C++实验1报告提交', 1, 'c++实验', 3, 'chy', CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 11 DAY)), ' 11:30:00'), 1, 34.052100, -118.243600);

-- ## 记录针对 Task 2: 'C++实验2代码签到' (task_id=2, group_id=1, group_name='c++实验')
-- ## 成员: dol (user_id=2)
INSERT INTO `tasks_record` (`task_id`, `task_name`, `group_id`, `group_name`, `user_id`, `username`, `signed_time`, `status`, `latitude`, `longitude`, `ssid`, `bssid`) VALUES
(2, 'C++实验2代码签到', 1, 'c++实验', 2, 'dol', CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 5 DAY)), ' 15:00:00'), 1, 23.0507, 113.4016, 'Lab_WiFi_CXX', 'AA:BB:CC:11:22:33');

-- ## 记录针对 Task 5: 'UML图提交1' (task_id=5, group_id=2, group_name='uml实验')
-- ## 成员: student1 (user_id=4), student2 (user_id=5)
INSERT INTO `tasks_record` (`task_id`, `task_name`, `group_id`, `group_name`, `user_id`, `username`, `signed_time`, `status`, `latitude`, `longitude`, `tagid`, `tagname`) VALUES
(5, 'UML图提交1', 2, 'uml实验', 4, 'student1', CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 13 DAY)), ' 14:00:00'), 1, 23.0507, 113.4016, 'UML_NFC_TAG_001', '教室门口NFC点'),
(5, 'UML图提交1', 2, 'uml实验', 5, 'student2', CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 12 DAY)), ' 16:30:00'), 1, 23.0507, 113.4016, 'UML_NFC_TAG_001', '教室门口NFC点');

-- ## 记录针对 Task 6: 'UML用例分析' (task_id=6, group_id=2, group_name='uml实验')
-- ## 成员: student1 (user_id=4)
INSERT INTO `tasks_record` (`task_id`, `task_name`, `group_id`, `group_name`, `user_id`, `username`, `signed_time`, `status`, `latitude`, `longitude`) VALUES
(6, 'UML用例分析', 2, 'uml实验', 4, 'student1', CONCAT(DATE(DATE_SUB(NOW(), INTERVAL 7 DAY)), ' 09:30:00'), 1, 23.0507, 113.4016);
