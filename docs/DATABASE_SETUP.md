# ====================================
# MySQL 初始化脚本
# ====================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS mistakery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'mistakery'@'%' IDENTIFIED BY 'mistakery_pass';

-- 授权
GRANT ALL PRIVILEGES ON mistakery.* TO 'mistakery'@'%';
FLUSH PRIVILEGES;

-- 使用数据库
USE mistakery;

-- ====================================
-- 用户表
-- ====================================
CREATE TABLE IF NOT EXISTS user (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(500),
    target_exam VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 用户设置表
-- ====================================
CREATE TABLE IF NOT EXISTS user_settings (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    font_size INT DEFAULT 16,
    auto_next BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 科目表
-- ====================================
CREATE TABLE IF NOT EXISTS subject (
    id CHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    description TEXT,
    parent_id CHAR(36),
    level INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_parent_id (parent_id),
    INDEX idx_level (level),
    FOREIGN KEY (parent_id) REFERENCES subject(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 题目表
-- ====================================
CREATE TABLE IF NOT EXISTS question (
    id CHAR(36) PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type ENUM('single', 'multiple', 'boolean', 'fill', 'essay', 'calculation', 'other') NOT NULL,
    options JSON,
    correct_answer TEXT NOT NULL,
    analysis TEXT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    knowledge_points JSON,
    tags JSON,
    source VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_type (question_type),
    INDEX idx_difficulty (difficulty),
    FULLTEXT INDEX ft_question (question_text, analysis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 错题表
-- ====================================
CREATE TABLE IF NOT EXISTS mistake (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    question_id CHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('single', 'multiple', 'boolean', 'fill', 'essay', 'calculation', 'other') NOT NULL,
    options JSON,
    correct_answer TEXT NOT NULL,
    user_answer TEXT,
    analysis TEXT,
    subject VARCHAR(100),
    knowledge_points JSON,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    status ENUM('pending', 'learning', 'mastered') DEFAULT 'pending',
    is_favorite BOOLEAN DEFAULT FALSE,
    review_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_subject (subject),
    INDEX idx_question_type (question_type),
    INDEX idx_status (status),
    INDEX idx_difficulty (difficulty),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_updated_at (updatedAt DESC),
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_subject (user_id, subject),
    FULLTEXT INDEX ft_question (question_text, analysis),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 练习记录表
-- ====================================
CREATE TABLE IF NOT EXISTS exam_record (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(100),
    question_count INT NOT NULL,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    total_time INT DEFAULT 0,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    filter_config JSON,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_subject (subject),
    INDEX idx_status (status),
    INDEX idx_started_at (startedAt DESC),
    INDEX idx_created_at (createdAt DESC),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 练习答案表
-- ====================================
CREATE TABLE IF NOT EXISTS exam_answer (
    id CHAR(36) PRIMARY KEY,
    exam_record_id CHAR(36) NOT NULL,
    question_id CHAR(36) NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    time_spent INT DEFAULT 0,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_exam_record_id (examRecordId),
    INDEX idx_question_id (questionId),
    FOREIGN KEY (exam_record_id) REFERENCES exam_record(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 复习表
-- ====================================
CREATE TABLE IF NOT EXISTS review (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    mistake_id CHAR(36) NOT NULL,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    next_review_date DATETIME NOT NULL,
    result ENUM('again', 'hard', 'good', 'easy') DEFAULT 'good',
    interval_days INT DEFAULT 1,
    ease_factor DECIMAL(3,2) DEFAULT 2.50,
    box_level INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (userId),
    INDEX idx_mistake_id (mistakeId),
    INDEX idx_review_date (reviewDate),
    INDEX idx_next_date (nextReviewDate),
    INDEX idx_box_level (boxLevel),
    INDEX idx_user_due (userId, nextReviewDate),
    INDEX idx_user_box (userId, boxLevel),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (mistake_id) REFERENCES mistake(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 上传文件表
-- ====================================
CREATE TABLE IF NOT EXISTS upload (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    path VARCHAR(500) NOT NULL,
    url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (userId),
    INDEX idx_created_at (createdAt DESC),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================
-- 插入初始数据
-- ====================================

-- 插入默认科目
INSERT INTO subject (id, code, name, icon, color, level, sort_order) VALUES
('1', 'math', '数学', 'Math', '#ff6e00', 0, 1),
('2', 'english', '英语', 'Reading', '#409eff', 0, 2),
('3', 'chinese', '语文', 'Notebook', '#67c23a', 0, 3),
('4', 'physics', '物理', 'Odometer', '#e6a23c', 0, 4),
('5', 'chemistry', '化学', 'Flask', '#f56c6c', 0, 5)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ====================================
-- 创建视图
-- ====================================

CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.id,
    u.username,
    COUNT(DISTINCT m.id) AS total_mistakes,
    COUNT(DISTINCT er.id) AS total_practices,
    COUNT(DISTINCT r.id) AS total_reviews
FROM user u
LEFT JOIN mistake m ON u.id = m.userId
LEFT JOIN exam_record er ON u.id = er.userId
LEFT JOIN review r ON u.id = r.userId
GROUP BY u.id;

-- ====================================
-- 创建存储过程
-- ====================================

DELIMITER //

CREATE PROCEDURE sp_update_review_stats(IN user_id CHAR(36))
BEGIN
    UPDATE user u
    SET u.nickname = CONCAT('User', SUBSTRING(u.id, 1, 8))
    WHERE u.id = user_id AND u.nickname IS NULL;
END //

DELIMITER ;

-- ====================================
-- 完成初始化
-- ====================================

-- 设置字符集
SET NAMES utf8mb4;

-- 显示表列表
SHOW TABLES;
