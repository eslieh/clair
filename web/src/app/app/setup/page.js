'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, User as UserIcon } from 'lucide-react';
import { getProfile, updateProfile } from '../account/actions';
import { signOut } from '@/app/auth/actions';
import styles from './setup.module.css';

export default function SetupPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProfile().then(data => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
      }
    });
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setAvatarUrl(data.secure_url);
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDone = async () => {
    if (!displayName || !username) {
      alert('Display Name and Username are required');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('username', username.startsWith('@') ? username : `@${username}`);
      formData.append('avatarUrl', avatarUrl);
      formData.append('status', profile?.status || '');

      const result = await updateProfile(formData);
      if (result.success) {
        router.push('/app/calls');
      } else {
        alert(result.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile && !isSaving) {
    return (
      <div className={styles.setupContainer}>
        <div className={styles.loadingOverlay}>
          <Loader2 className={styles.spinner} size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.setupContainer}>
      <header className={styles.setupHeader}>
        <button type="button" className={styles.cancelBtn} onClick={() => signOut()}>
          Sign Out
        </button>
        <button 
          type="button" 
          className={styles.doneBtn} 
          onClick={handleDone}
          disabled={!displayName || !username || isSaving || isUploading}
        >
          {isSaving ? 'Saving...' : 'Done'}
        </button>
      </header>

      <div className={styles.avatarSection}>
        <div className={styles.avatarWrapper}>
          {isUploading ? (
            <Loader2 className={styles.spinner} size={32} />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
          ) : (
            <UserIcon className={styles.placeholderIcon} />
          )}
        </div>
        <button 
          type="button" 
          className={styles.editPhotoBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarUrl ? 'Edit Photo' : 'Add Photo'}
        </button>
        <input 
          ref={fileInputRef} 
          type="file" 
          hidden 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
      </div>

      <div className={styles.formSection}>
        <div className={styles.groupedList}>
          <div className={styles.field}>
            <span className={styles.label}>Name</span>
            <input 
              className={styles.input} 
              placeholder="Display Name" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.label}>Username</span>
            <input 
              className={styles.input} 
              placeholder="@username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        <p className={styles.footerText}>
          Your username and display name will be visible to your contacts in Clair.
        </p>
      </div>

      {(isSaving || isUploading) && (
        <div className={styles.loadingOverlay}>
          <Loader2 className={styles.spinner} size={32} />
        </div>
      )}
    </div>
  );
}
