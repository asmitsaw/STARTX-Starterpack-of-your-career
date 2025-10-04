-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  certificate_code VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(255),
  course_id INTEGER NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  completion_date VARCHAR(100) NOT NULL,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on certificate_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_certificate_code ON certificates(certificate_code);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_id ON certificates(user_id);

-- Create index on course_id
CREATE INDEX IF NOT EXISTS idx_course_id ON certificates(course_id);
