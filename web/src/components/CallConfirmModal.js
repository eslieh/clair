'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Video } from 'lucide-react';
import styles from './CallConfirmModal.module.css';

export default function CallConfirmModal({ contact, type = 'video', onConfirm, onClose }) {
  if (!contact) return null;
  
  const initial = (contact.display_name || 'U').charAt(0).toUpperCase();

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
          <div className={styles.avatarLarge}>
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt="" className={styles.avatarImg} />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <h2 className={styles.name}>{contact.display_name || 'Unknown'}</h2>
          <p className={styles.subtitle}>@{contact.username || 'user'}</p>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>Start a {type} call with this contact?</p>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button 
            className={styles.confirmBtn} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {type === 'video' ? <Video size={18} fill="currentColor" /> : <Phone size={18} fill="currentColor" />}
            Start {type.charAt(0).toUpperCase() + type.slice(1)} Call
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
