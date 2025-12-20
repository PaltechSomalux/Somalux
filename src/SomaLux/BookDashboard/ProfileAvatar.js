import React, { useRef, useState } from "react";
import { Camera, UserCircle } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { supabase } from "../Books/supabaseClient";

export const ProfileAvatar = ({ 
  profileImage, 
  setProfileImage, 
  authUser, 
  size = 72,
  showUploadButton = true 
}) => {
  const fileInputRef = useRef(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageSaveMessage, setImageSaveMessage] = useState('');

  const handleUpload = async (e) => {
    console.log('handleUpload triggered');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    console.log('File selected:', file.name, file.type, file.size);

    // Basic validation
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      toast.error('Please select an image file');
      return;
    }

    // Local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);

    // Determine previous avatar object path for cleanup
    const prevStored = (() => {
      try { return JSON.parse(localStorage.getItem('userProfile') || '{}'); } catch (e) { return {}; }
    })();
    const prevAvatarUrl = prevStored?.avatar || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null;
    const extractPathFromUrl = (url) => {
      if (!url) return null;
      try {
        const marker = '/avatars/';
        const idx = url.indexOf(marker);
        if (idx === -1) return null;
        return url.substring(idx + marker.length);
      } catch (e) { return null; }
    };
    const prevAvatarPath = extractPathFromUrl(prevAvatarUrl);

    if (!authUser || !authUser.id) {
      toast.info('Sign in to save your profile photo permanently');
      return;
    }

    setIsSavingImage(true);
    setImageSaveMessage('Saving...');

    try {
      const ext = file.name.split('.').pop();
      // Simplify file path - just use timestamp and extension
      const fileName = `${Date.now()}.${ext}`;
      console.log('Uploading file as:', fileName);

      // Upload to storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });
      console.log('Upload response received - uploadData:', uploadData, 'uploadError:', uploadError);

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        const errMsg = uploadError.message || JSON.stringify(uploadError);
        toast.error('Avatar upload failed: ' + errMsg, { autoClose: 6000 });
        setIsSavingImage(false);
        setImageSaveMessage('');
        return;
      }

      console.info('Avatar uploaded successfully');
      const publicUrl = supabase.storage.from('user-avatars').getPublicUrl(fileName).data.publicUrl;

      // Avatar is already uploaded to storage successfully
      console.log('Avatar uploaded and available at:', publicUrl);

      // Update auth user metadata
      try {
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
        console.log('Auth metadata updated');
      } catch (uErr) {
        console.warn('Failed to update auth user metadata:', uErr?.message);
      }

      // Update local storage
      const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const merged = { ...stored, avatar: publicUrl, avatar_path: fileName };
      localStorage.setItem('userProfile', JSON.stringify(merged));
      console.log('Local storage updated');
      
      // Update avatar map
      try {
        const map = JSON.parse(localStorage.getItem('avatarsByEmail') || '{}');
        if (authUser?.email) {
          map[authUser.email] = publicUrl;
          localStorage.setItem('avatarsByEmail', JSON.stringify(map));
        }
      } catch (e) {
        console.warn('Avatar map update failed:', e?.message);
      }
      
      // Update UI
      setProfileImage(publicUrl);
      setImageSaveMessage('Saved');
      toast.success('Profile photo saved successfully!');
      console.log('UI updated with new avatar');

      // Delete previous avatar if exists
      try {
        if (prevAvatarPath && prevAvatarPath !== fileName) {
          const { error: delErr } = await supabase.storage.from('user-avatars').remove([prevAvatarPath]);
          if (delErr) {
            console.warn('Failed to delete previous avatar:', delErr?.message);
          } else {
            console.info('Previous avatar deleted:', prevAvatarPath);
          }
        }
      } catch (delEx) {
        console.warn('Error deleting previous avatar:', delEx?.message);
      }
    } catch (err) {
      console.error('handleUpload error', err);
      toast.error('Unexpected error saving avatar');
    } finally {
      setTimeout(() => {
        setIsSavingImage(false);
        setImageSaveMessage('');
      }, 700);
    }
  };

  return (
    <div className="profile-pic-wrapper">
      {profileImage ? (
        <img
          src={profileImage}
          className={size > 40 ? "profile-large" : "profile-avatar"}
          alt="Profile"
          onError={() => {
            console.warn('Profile image failed to load');
            setProfileImage(null);
          }}
        />
      ) : (
        <UserCircle size={size} weight="duotone" color="#8696a0" />
      )}
      
      {showUploadButton && (
        <>
          <span 
            className="upload-btn" 
            onClick={() => fileInputRef.current?.click()} 
            aria-label="Upload profile photo"
          >
            <Camera size={18} weight="fill" />
          </span>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleUpload} 
            style={{ display: "none" }} 
          />
        </>
      )}

      {isSavingImage && (
        <div className="avatar-saving">
          <div className="saving-spinner" aria-hidden="true"></div>
          <div className="saving-text">{imageSaveMessage || 'Saving...'}</div>
        </div>
      )}
    </div>
  );
};