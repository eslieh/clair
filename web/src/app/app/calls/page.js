'use client';

import { useRouter } from 'next/navigation';
import { Phone, Video } from 'lucide-react';
import styles from '../routes.module.css';

export default function CallsPage() {
  const router = useRouter();
  const startNewCall = () => {
    // In a real app, you would navigate to a specific call ID
    router.push('/app/call/123'); I 
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayTitle}>Hey, Eslieh</div>
      <div className={styles.overlayText}>
        Pick a recent call from the sidebar, or start a new call.
      </div>
      <button 
        onClick={startNewCall}
        className={styles.newCallButton}
      >
        <Video size={18} style={{ marginRight: 8 }} />
        New Clair Call
      </button>
    </div>
  );
}
