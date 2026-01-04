'use client';

import { useCall } from '@/contexts/CallContext';
import { Phone, PhoneOff } from 'lucide-react';
import styles from './Ringer.module.css';
import { useEffect, useState } from 'react';

export default function Ringer() {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (incomingCall) {
      // Small delay to allow mounting before sliding in
      const t = setTimeout(() => setVisible(true), 50);
      
      // Play sound
      // In real implementation we'd need a sound file, simulating for now with log
      console.log('Playing Ringtone...'); 
      
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [incomingCall]);

  if (!incomingCall && !visible) return null;

  return (
    <div className={`${styles.ringerOverlay} ${incomingCall && visible ? styles.visible : ''}`}>
      <div className={styles.avatar}>
        {incomingCall?.name?.[0]?.toUpperCase() || 'C'}
      </div>
      
      <div className={styles.content}>
        <div className={styles.name}>{incomingCall?.name || 'Incoming Call'}</div>
        <div className={styles.label}>Clair Audio...</div>
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
