'use client';

import { useCall } from '@/contexts/CallContext';
import { Phone, PhoneOff } from 'lucide-react';
import styles from './Ringer.module.css';
import { useEffect, useState, useRef } from 'react';

export default function Ringer() {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const [visible, setVisible] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (incomingCall) {
      // Initialize audio
      if (!audioRef.current) {
        audioRef.current = new Audio('/apple_ring.mp3');
        audioRef.current.loop = true;
      }
      
      // Play sound
      audioRef.current.play().catch(e => console.warn('Audio playback failed (need user interaction):', e));
      
      // Small delay to allow mounting before sliding in
      const t = setTimeout(() => setVisible(true), 50);
      
      return () => {
        clearTimeout(t);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    } else {
      setVisible(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [incomingCall]);

  if (!incomingCall && !visible) return null;

  return (
    <div className={`${styles.ringerOverlay} ${incomingCall && visible ? styles.visible : ''}`}>
      <div className={styles.avatar}>
        {incomingCall?.avatar_url ? (
          <img src={incomingCall.avatar_url} alt="" className={styles.avatarImg} />
        ) : (
          incomingCall?.name?.[0]?.toUpperCase() || 'C'
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.name}>{incomingCall?.name || 'Incoming Call'}</div>
        <div className={styles.label}>Clair Video...</div>
      </div>

      <div className={styles.actions}>
        <button 
            className={`${styles.roundBtn} ${styles.decline}`} 
            onClick={declineCall} 
            aria-label="Decline"
        >
          <PhoneOff size={20} fill="currentColor" />
        </button>
        <button 
            className={`${styles.roundBtn} ${styles.accept}`} 
            onClick={acceptCall}
            aria-label="Accept"
        >
          <Phone size={20} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
