/**
 * ChatMe Migration Routes
 * Helps migrate Firebase groups/channels to Supabase
 */

import express from 'express';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';

const router = express.Router();

// Initialize Firebase Admin for reading Firebase data
let firebaseDb = null;
let firebaseAdmin = null;

function initFirebaseAdmin() {
  if (firebaseDb) return firebaseDb;
  
  try {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || 
      './config/firebase-service-account.json';
    
    const serviceAccount = require(serviceAccountPath);
    
    if (!firebaseAdmin) {
      firebaseAdmin = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      }, 'migrationApp');
    }
    
    firebaseDb = getFirestoreAdmin(firebaseAdmin);
    return firebaseDb;
  } catch (error) {
    console.warn('⚠️ Firebase Admin not available for migration:', error.message);
    return null;
  }
}

/**
 * GET /api/chatme/migration/status
 * Check what needs to be migrated
 */
router.get('/migration/status', async (req, res) => {
  try {
    const { supabaseAdmin } = req.app.locals;
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Count existing groups and channels in Supabase
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id', { count: 'exact' });
    
    const { data: members, error: membersError } = await supabaseAdmin
      .from('group_members')
      .select('id', { count: 'exact' });

    res.json({
      supabase: {
        groups_count: groups?.length || 0,
        members_count: members?.length || 0,
      },
      message: 'Use POST /api/chatme/migration/sync-groups to import from Firebase',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chatme/migration/sync-groups
 * Migrate groups and group members from Firebase to Supabase
 */
router.post('/migration/sync-groups', async (req, res) => {
  try {
    const { supabaseAdmin } = req.app.locals;
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const firebaseDb = initFirebaseAdmin();
    if (!firebaseDb) {
      return res.status(500).json({ error: 'Firebase Admin not available' });
    }

    // Fetch groups from Firebase
    const groupsRef = await firebaseDb.collection('groups').get();
    const groups = [];
    const members = [];

    console.log(`📥 Migrating ${groupsRef.size} groups from Firebase...`);

    groupsRef.forEach((doc) => {
      const groupData = doc.data();
      groups.push({
        id: doc.id, // Use Firebase ID as UUID
        name: groupData.name || 'Unnamed Group',
        description: groupData.description || null,
        avatar_url: groupData.avatar || groupData.avatarUrl || null,
        creator_id: groupData.createdBy || null,
        is_archived: groupData.isArchived || false,
        created_at: groupData.createdAt?.toDate?.() || new Date(),
        updated_at: groupData.updatedAt?.toDate?.() || new Date(),
      });

      // Extract members
      if (groupData.members && Array.isArray(groupData.members)) {
        groupData.members.forEach((memberId) => {
          members.push({
            group_id: doc.id,
            user_id: memberId,
            role: groupData.admins?.includes(memberId) ? 'admin' : 'member',
            joined_at: groupData.createdAt?.toDate?.() || new Date(),
          });
        });
      }

      if (groupData.admins && Array.isArray(groupData.admins)) {
        groupData.admins.forEach((adminId) => {
          // Update existing member to admin role if not already added
          const existing = members.find(m => m.group_id === doc.id && m.user_id === adminId);
          if (!existing) {
            members.push({
              group_id: doc.id,
              user_id: adminId,
              role: 'admin',
              joined_at: groupData.createdAt?.toDate?.() || new Date(),
            });
          }
        });
      }
    });

    // Insert groups into Supabase
    if (groups.length > 0) {
      const { data: insertedGroups, error: groupError } = await supabaseAdmin
        .from('groups')
        .upsert(groups, { onConflict: 'id' });

      if (groupError) throw new Error(`Group insert failed: ${groupError.message}`);
      console.log(`✅ Migrated ${groups.length} groups`);
    }

    // Insert members into Supabase
    if (members.length > 0) {
      const { data: insertedMembers, error: memberError } = await supabaseAdmin
        .from('group_members')
        .upsert(members, { onConflict: 'group_id,user_id' });

      if (memberError) throw new Error(`Member insert failed: ${memberError.message}`);
      console.log(`✅ Migrated ${members.length} group memberships`);
    }

    res.json({
      success: true,
      message: `Migrated ${groups.length} groups and ${members.length} members`,
      groups_count: groups.length,
      members_count: members.length,
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chatme/users
 * Fetch all users for creating 1-on-1 chats
 */
router.get('/users', async (req, res) => {
  try {
    const { supabaseAdmin } = req.app.locals;
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .order('full_name');

    if (error) throw error;

    res.json({
      success: true,
      users: users || [],
      count: users?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chatme/groups/:userId
 * Fetch user's groups (they are member of)
 */
router.get('/groups/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { supabaseAdmin } = req.app.locals;
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Find groups where user is a member
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const groupIds = memberships?.map((m) => m.group_id) || [];

    if (groupIds.length === 0) {
      return res.json({ success: true, groups: [] });
    }

    // Get group details
    const { data: groups, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (groupError) throw groupError;

    res.json({
      success: true,
      groups: groups || [],
      count: groups?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chatme/debug/profiles
 * Check what's in the profiles table
 */
router.get('/debug/profiles', async (req, res) => {
  try {
    const { supabaseAdmin } = req.app.locals;
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (error) throw error;

    res.json({
      success: true,
      count: profiles?.length || 0,
      profiles: profiles || [],
      columns: profiles && profiles.length > 0 ? Object.keys(profiles[0]) : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/chatme/debug/auth-users
 * Check Supabase auth users
 */
router.get('/debug/auth-users', async (req, res) => {
  try {
    const { supabaseAdmin } = req.app.locals;
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    res.json({
      success: true,
      count: users?.users?.length || 0,
      users: users?.users?.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      })) || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chatme/debug/create-test-profiles
 * Create test profiles from auth users
 */
router.post('/debug/create-test-profiles', async (req, res) => {
  try {
    const { supabaseAdmin } = req.app.locals;
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    // Create profiles for users that don't have them
    const newProfiles = [];
    for (const user of authUsers.users || []) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existing) {
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            is_online: false,
          });

        if (!insertError) {
          newProfiles.push(user.email);
        }
      }
    }

    res.json({
      success: true,
      message: `Created ${newProfiles.length} new profiles`,
      profiles: newProfiles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
