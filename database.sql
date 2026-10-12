CREATE DATABASE smart_certificate_db;

USE smart_certificate_db;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    certificate_id VARCHAR(100) UNIQUE NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_email VARCHAR(150),
    course_name VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    issued_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (issued_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);