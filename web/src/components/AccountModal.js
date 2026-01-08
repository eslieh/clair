'use client';

import { useState, useRef, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, LogOut, User as UserIcon } from 'lucide-react';
import styles from './AccountModal.module.css';
import { updateProfile } from '@/app/app/account/actions';
import { signOut } from '@/app/auth/actions';

export default function AccountModal({ profile, onClose, onUpdate }) {
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState('idle');
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [status, setStatus] = useState(profile?.status || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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
        if (onUpdate) onUpdate({ ...profile, display_name: displayName, username, status, avatar_url: avatarUrl });
        setTimeout(() => {
          setSaveState('idle');
          onClose();
        }, 800);
      }
    });
  };

  return (
    <motion.div 
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatarLarge}>
              {isUploading ? (
                <Loader2 className={styles.spinner} size={32} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                <UserIcon size={40} className={styles.placeholder} />
              )}
            </div>
            <button 
              className={styles.editAvatarBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </div>
          <input 
            className={styles.nameInput}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
          />
        </div>

        <div className={styles.detailsList}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>username</span>
            <input 
              className={styles.detailInput}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
            />
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>status</span>
            <input 
              className={styles.detailInput}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="What's on your mind?"
            />
          </div>
        </div>

        <div className={styles.footerActions}>
          <button 
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isPending || isUploading}
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            className={styles.signOutBtn}
            onClick={() => signOut()}
          >
            <LogOut size={18} style={{ marginRight: 8 }} />
            Sign Out
          </button>
        </div>

        {saveState === 'saved' && (
          <div className={styles.saveStatus}>Profile updated successfully!</div>
        )}
      </motion.div>
    </motion.div>
  );
}
