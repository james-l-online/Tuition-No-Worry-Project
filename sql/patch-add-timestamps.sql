-- Add created_at and updated_at to tables that may be missing them
-- This script is idempotent: it checks for column existence before adding.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class' AND column_name='created_at') THEN
    ALTER TABLE class ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='class' AND column_name='updated_at') THEN
    ALTER TABLE class ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teacher' AND column_name='updated_at') THEN
    ALTER TABLE teacher ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subject' AND column_name='created_at') THEN
    ALTER TABLE subject ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subject' AND column_name='updated_at') THEN
    ALTER TABLE subject ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lesson' AND column_name='created_at') THEN
    ALTER TABLE lesson ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lesson' AND column_name='updated_at') THEN
    ALTER TABLE lesson ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exam' AND column_name='created_at') THEN
    ALTER TABLE exam ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exam' AND column_name='updated_at') THEN
    ALTER TABLE exam ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignment' AND column_name='created_at') THEN
    ALTER TABLE assignment ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignment' AND column_name='updated_at') THEN
    ALTER TABLE assignment ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student' AND column_name='updated_at') THEN
    ALTER TABLE student ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='message' AND column_name='updated_at') THEN
    ALTER TABLE message ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END$$;
