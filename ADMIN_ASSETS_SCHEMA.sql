-- Admin Assets Table
-- Stores system utility assets like emails and end dates for admin operations

CREATE TABLE IF NOT EXISTS admin_assets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL -- admin email who created it
);

-- Create RLS policies for admin assets table
ALTER TABLE admin_assets ENABLE ROW LEVEL SECURITY;

-- Only specific superadmins can view assets
CREATE POLICY "Superadmins can view assets" ON admin_assets
  FOR SELECT
  USING (
    auth.jwt()->>'email' IN ('campuslives254@gmail.com', 'paltechsomalux@gmail.com')
  );

-- Only specific superadmins can insert assets
CREATE POLICY "Superadmins can insert assets" ON admin_assets
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'email' IN ('campuslives254@gmail.com', 'paltechsomalux@gmail.com')
  );

-- Only specific superadmins can update assets
CREATE POLICY "Superadmins can update assets" ON admin_assets
  FOR UPDATE
  USING (
    auth.jwt()->>'email' IN ('campuslives254@gmail.com', 'paltechsomalux@gmail.com')
  );

-- Only specific superadmins can delete assets
CREATE POLICY "Superadmins can delete assets" ON admin_assets
  FOR DELETE
  USING (
    auth.jwt()->>'email' IN ('campuslives254@gmail.com', 'paltechsomalux@gmail.com')
  );

-- Create indexes for better performance
CREATE INDEX idx_admin_assets_created_at ON admin_assets(created_at DESC);
CREATE INDEX idx_admin_assets_email ON admin_assets(email);
