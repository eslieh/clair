'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { Camera, Loader2, Upload, User } from 'lucide-react';
import { getProfile, updateProfile } from './actions';
import { signOut } from '@/app/auth/actions';
import styles from '../routes.module.css';

const SaveStatus = ({ status }) => {
  if (status === 'saving') return <span className={styles.saveStatus}>Saving…</span>;
  if (status === 'saved') return <span className={styles.saveStatus}>Saved!</span>;
  if (status === 'error') return <span className={styles.saveStatusError}>Error saving</span>;
  return null;
};

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState('idle');
  
  // Image Upload State
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProfile().then(data => {
      if (data) {
        setProfile(data);
        setAvatarUrl(data.avatar_url || '');
      }
    });
  }, []);

  if (!profile) {
    return (
      <div className={styles.overlayWide}>
        <div className={styles.overlayTitle}>Account</div>
        <div className={styles.overlayText}>Loading profile…</div>
      </div>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
      // Optional: Add folder, tags, etc.
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (data.secure_url) {
        setAvatarUrl(data.secure_url);
        // Automatically save the new avatar URL
        const profileData = new FormData();
        profileData.append('avatarUrl', data.secure_url);
        profileData.append('displayName', profile.display_name); // Preserve other fields
        profileData.append('username', profile.username);
        profileData.append('status', profile.status);
        
        await updateProfile(profileData);
      } else {
        console.error('Upload failed', data);
        alert('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (formData) => {
    setSaveState('saving');
    // Ensure accurate avatar URL is sent
    formData.set('avatarUrl', avatarUrl);
    
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        setSaveState('error');
      } else {
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      }
    });
  };

  return (
    <div className={styles.overlayWide}>
      <header className={styles.headerRow}>
        <div className={styles.headerContent}>
          <div className={styles.overlayTitle}>Account</div>
          <div className={styles.overlaySubtitle} style={{ marginTop: '0.25rem' }}>
            Manage your profile and presence
          </div>
        </div>
        <SaveStatus status={saveState} />
      </header>

      <div className={styles.avatarSection}>
        <div className={styles.avatarWrapper}>
          {isUploading ? (
            <div className={styles.avatarLoading}>
              <Loader2 className={styles.spinner} size={24} />
            </div>
          ) : (
            <img 
              src={avatarUrl || `https://ui-avatars.com/api/?name=${profile.display_name}&background=random`} 
              alt="Profile" 
              className={styles.avatarImage} 
            />
          )}
          <button 
            type="button"
            className={styles.avatarEditBtn}
            onClick={() => fileInputRef.current?.click()}
            title="Change photo"
          >
            <Camera size={16} />
          </button>
        </div>
        <div className={styles.avatarInfo}>
          <h3 className={styles.avatarName}>{profile.display_name || 'Your Name'}</h3>
          <p className={styles.avatarEmail}>{profile.email}</p>
        </div>
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          hidden 
          onChange={handleImageUpload}
        />
      </div>

      <form action={handleSubmit} className={styles.formStack}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Display Name</span>
            <input
              className={styles.input}
              name="displayName"
              defaultValue={profile.display_name}
              placeholder="Your Name"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Username</span>
            <input
              className={styles.input}
              name="username"
              defaultValue={profile.username}
              placeholder="@username"
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Status</span>
          <input
            className={styles.input}
            name="status"
            defaultValue={profile.status}
            placeholder="What's on your mind?"
          />
        </label>

        <div className={styles.actionsRow} style={{ marginTop: '1.5rem' }}>
          <button 
            type="submit" 
            className={styles.primaryBtn}
            disabled={isPending || isUploading}
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      <hr className={styles.divider} />

      <form action={signOut}>
        <button
          type="submit"
          className={styles.dangerBtn}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
