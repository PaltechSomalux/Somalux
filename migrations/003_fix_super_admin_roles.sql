-- ============================================================
-- FIX SUPER ADMIN ROLES
-- Updates user accounts that should be super_admin but are marked as 'user'
-- ============================================================

-- Update super_admin users who are currently marked as 'user'
UPDATE profiles
SET role = 'super_admin'
WHERE role = 'user' AND (
  email = 'campuslives254@gmail.com' OR
  email = 'paltechsomalux@gmail.com'
);

-- Verification
SELECT id, email, username, role FROM profiles WHERE role = 'super_admin' ORDER BY created_at;
