'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { Camera, Loader2, User as UserIcon, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile } from './actions';
import { signOut } from '@/app/auth/actions';
import styles from './account.module.css';

const SaveStatus = ({ status }) => {
  if (status === 'saving') return <div className={styles.saveStatus}>Saving…</div>;
  if (status === 'saved') return <div className={styles.saveStatus}>Saved!</div>;
  if (status === 'error') return <div className={styles.saveStatusError}>Error saving</div>;
  return <div className={styles.saveStatus} />;
};

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState('idle');
  
  // Local form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProfile().then(data => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setStatus(data.status || '');
        setAvatarUrl(data.avatar_url || '');
      }
    });
  }, []);

  if (!profile) {
    return (
      <div className={styles.accountContainer}>
        <div className={styles.navHeader}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <ChevronLeft size={24} />
            <span>Back</span>
          </button>
        </div>
        <div className={styles.accountHeader}>
          <h1 className={styles.title}>Account</h1>
        </div>
        <p>Loading profile…</p>
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
        profileData.append('displayName', displayName);
        profileData.append('username', username);
        profileData.append('status', status);
        
        await updateProfile(profileData);
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

  const handleSave = () => {
    setSaveState('saving');
    
    startTransition(async () => {
      const formData = new FormData();
      formData.append('displayName', displayName);
      formData.append('username', username);
      formData.append('status', status);
      formData.append('avatarUrl', avatarUrl);

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
    <div className={styles.accountContainer}>
      <div className={styles.navHeader}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ChevronLeft size={24} />
          <span>Back</span>
        </button>
      </div>
      <header className={styles.accountHeader}>
        <h1 className={styles.title}>Account</h1>
        <button 
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={isPending || isUploading}
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </header>

      <div className={styles.avatarSection}>
        <div className={styles.avatarWrapper}>
          {isUploading ? (
            <div className={styles.avatarLoading}>
              <Loader2 className={styles.spinner} size={32} />
            </div>
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className={styles.avatarImage} />
          ) : (
            <UserIcon className={styles.placeholderIcon} />
          )}
        </div>
        <button 
          type="button"
          className={styles.editPhotoBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          Edit Photo
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          hidden 
          onChange={handleImageUpload}
        />
      </div>

      <div className={styles.formSection}>
        <div className={styles.groupedList}>
          <div className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Username</span>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Status</span>
            <input
              className={styles.input}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="What's on your mind?"
            />
          </div>
        </div>
        
        <SaveStatus status={saveState} />

        <div className={styles.signOutSection}>
          <button
            type="button"
            className={styles.signOutBtn}
            onClick={() => signOut()}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
