-- Blog App schema
CREATE DATABASE IF NOT EXISTS blogdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blogdb;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  body MEDIUMTEXT NOT NULL,
  excerpt VARCHAR(300),
  cover_image VARCHAR(500),
  tag VARCHAR(60) DEFAULT 'general',
  read_minutes INT DEFAULT 1,
  status ENUM('draft','published') DEFAULT 'published',
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tag (tag),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  body VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed a demo author (password: Passw0rd!23 -- change in real deployments)
INSERT INTO users (name, email, password_hash)
VALUES ('Ada Editorial', 'editor@blogapp.dev', '$2a$10$YQwq0nY2vJ2E3d1s9m5FUeE3n7x8y9wYqk8f2e1r6t5u4i3o2p1q2')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO posts (title, slug, body, excerpt, tag, read_minutes, author_id)
VALUES
('Shipping to EKS Without Losing Sleep', 'shipping-to-eks-without-losing-sleep',
 'A deep dive into building a resilient GitOps pipeline for Kubernetes on AWS EKS, covering rollout strategies, health checks, and rollback automation.',
 'A deep dive into building a resilient GitOps pipeline for Kubernetes on AWS EKS.',
 'devops', 6, 1),
('Why We Moved Artifact Storage to Nexus', 'why-we-moved-artifact-storage-to-nexus',
 'How centralizing Docker images and npm packages in Nexus Repository cut our build times and gave us a single source of truth for releases.',
 'How centralizing artifacts in Nexus cut our build times in half.',
 'tooling', 4, 1),
('Static Analysis That Developers Actually Like', 'static-analysis-developers-actually-like',
 'Rolling out SonarQube quality gates without slowing teams down: practical thresholds, PR decoration, and technical debt triage.',
 'Rolling out SonarQube quality gates without slowing teams down.',
 'quality', 5, 1),
('Trivy in CI: Catching CVEs Before Production', 'trivy-in-ci-catching-cves-before-production',
 'A practical walkthrough of wiring Trivy image and filesystem scans into a Jenkins pipeline with severity gating.',
 'A practical walkthrough of wiring Trivy scans into Jenkins.',
 'security', 5, 1)
ON DUPLICATE KEY UPDATE title = VALUES(title);
