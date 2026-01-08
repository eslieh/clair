'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Phone, Video, Mail, Info, ChevronRight } from 'lucide-react';
import styles from './CallDetailModal.module.css';
import { useCall } from '@/contexts/CallContext';

export default function CallDetailModal({ item, onClose }) {
  const { startCall } = useCall();
  
  if (!item) return null;
  const { other, status, meta, direction } = item;
  const initial = (other?.display_name || 'U').charAt(0).toUpperCase();

  const handleAction = (type) => {
    if (type === 'video' || type === 'call') {
      startCall(other.id, other.display_name);
      onClose();
    }
    // Message and Mail can be implemented later
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
          <div className={styles.avatarLarge}>
            {other?.avatar_url ? (
              <img src={other.avatar_url} alt="" className={styles.avatarImg} />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <h2 className={styles.name}>{other?.display_name || 'Unknown'}</h2>
        </div>

        <div className={styles.actionsGrid}>
          <div className={styles.actionItem} onClick={() => handleAction('message')}>
            <div className={styles.actionIcon}><MessageSquare size={20} fill="currentColor" /></div>
            <span>message</span>
          </div>
          <div className={styles.actionItem} onClick={() => handleAction('call')}>
            <div className={styles.actionIcon}><Phone size={20} fill="currentColor" /></div>
            <span>call</span>
          </div>
          <div className={styles.actionItem} onClick={() => handleAction('video')}>
            <div className={styles.actionIcon}><Video size={20} fill="currentColor" /></div>
            <span>video</span>
          </div>
          <div className={`${styles.actionItem} ${styles.disabled}`}>
            <div className={styles.actionIcon}><Mail size={20} fill="currentColor" /></div>
            <span>mail</span>
          </div>
        </div>

        <div className={styles.detailsList}>
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>username</div>
            <div className={styles.detailValue}>@{other?.username || 'user'}</div>
          </div>
          
          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>FaceTime</div>
            <div className={styles.detailActions}>
              <Video size={18} className={styles.whiteIcon} onClick={() => handleAction('video')} />
              <Phone size={18} className={styles.whiteIcon} onClick={() => handleAction('call')} />
            </div>
          </div>

          <div className={styles.detailRow}>
            <div className={styles.detailLabel}>note</div>
            <div className={styles.detailValue}>Clair Call {status}</div>
          </div>
        </div>

        <div className={styles.historySection}>
          <div className={styles.historyHeading}>Recent Calls</div>
          <div className={styles.historyItem}>
            <div className={styles.historyMain}>
              <div className={styles.historyTitle}>{direction === 'outbound' ? 'Outgoing' : 'Incoming'} Call</div>
              <div className={styles.historyMeta}>{new Date(item.date).toLocaleString()}</div>
            </div>
            <div className={styles.historyStatus}>{status}</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
