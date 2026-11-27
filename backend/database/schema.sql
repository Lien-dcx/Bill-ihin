CREATE TABLE IF NOT EXISTS billihin_households (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(255) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'PHP',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT '₱',
  monthly_target_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  billing_cycle_day TINYINT UNSIGNED NOT NULL DEFAULT 1,
  invite_code VARCHAR(40) NOT NULL UNIQUE,
  settings JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (billing_cycle_day BETWEEN 1 AND 28)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Administrator','Member') NOT NULL DEFAULT 'Member',
  relationship VARCHAR(120) NULL,
  phone VARCHAR(40) NULL,
  monthly_income_share_note VARCHAR(500) NULL,
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  avatar_bg VARCHAR(16) NOT NULL DEFAULT '#0E7490',
  preferred_channel VARCHAR(100) NULL,
  joined_at DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  INDEX idx_users_household_role (household_id, role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NULL,
  color CHAR(7) NOT NULL DEFAULT '#00DCE5',
  monthly_allocation DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_category_household_name (household_id, name),
  CONSTRAINT fk_categories_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_budgets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  month DATE NOT NULL,
  allocated_amount DECIMAL(12,2) NOT NULL,
  alert_threshold_pct TINYINT UNSIGNED NOT NULL DEFAULT 85,
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_budget_household_category_month (household_id, category_id, month),
  CONSTRAINT fk_budgets_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES billihin_categories(id) ON DELETE RESTRICT,
  CHECK (allocated_amount >= 0),
  CHECK (alert_threshold_pct BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_bills (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  provider VARCHAR(120) NOT NULL,
  account_number VARCHAR(100) NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  billing_period VARCHAR(80) NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_bills_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  CONSTRAINT fk_bills_category FOREIGN KEY (category_id) REFERENCES billihin_categories(id) ON DELETE RESTRICT,
  INDEX idx_bills_household_due (household_id, due_date),
  CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_contributions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  bill_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  contribution_date DATE NOT NULL,
  payment_channel VARCHAR(100) NOT NULL,
  reference_no VARCHAR(120) NULL,
  notes TEXT NULL,
  status ENUM('Pending','Confirmed','Rejected') NOT NULL DEFAULT 'Pending',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATE NULL,
  rejection_reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contributions_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contributions_bill FOREIGN KEY (bill_id) REFERENCES billihin_bills(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contributions_member FOREIGN KEY (member_id) REFERENCES billihin_users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_contributions_reviewer FOREIGN KEY (reviewed_by) REFERENCES billihin_users(id) ON DELETE SET NULL,
  INDEX idx_contributions_bill_status (bill_id, status),
  INDEX idx_contributions_member (member_id, contribution_date),
  CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  bill_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  priority ENUM('Low','Normal','High','Urgent') NOT NULL DEFAULT 'Normal',
  notes VARCHAR(500) NULL,
  created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_assignments_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  CONSTRAINT fk_assignments_bill FOREIGN KEY (bill_id) REFERENCES billihin_bills(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_member FOREIGN KEY (member_id) REFERENCES billihin_users(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_assignment_bill_member (bill_id, member_id),
  CHECK (target_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  bill_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(100) NOT NULL,
  receipt_reference VARCHAR(120) NOT NULL,
  paid_by VARCHAR(120) NOT NULL,
  notes TEXT NULL,
  status ENUM('Settled') NOT NULL DEFAULT 'Settled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES billihin_bills(id) ON DELETE RESTRICT,
  INDEX idx_payments_bill_date (bill_id, payment_date),
  CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  type ENUM('info','success','warning','danger') NOT NULL DEFAULT 'info',
  category VARCHAR(80) NOT NULL DEFAULT 'System',
  target_page VARCHAR(80) NOT NULL DEFAULT 'dashboard',
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES billihin_users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS billihin_activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  household_id BIGINT UNSIGNED NOT NULL,
  actor VARCHAR(120) NOT NULL,
  action VARCHAR(500) NOT NULL,
  kind VARCHAR(40) NOT NULL DEFAULT 'info',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_household FOREIGN KEY (household_id) REFERENCES billihin_households(id) ON DELETE RESTRICT,
  INDEX idx_activities_household_created (household_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
