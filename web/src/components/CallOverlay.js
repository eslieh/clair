'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Mic, MicOff, PhoneOff, Maximize2 } from 'lucide-react';
import { useCall, CALL_STATES } from '@/contexts/CallContext';
import styles from './CallOverlay.module.css';

export default function CallOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    callState, 
    callerName, 
    isMuted, 
    toggleMute, 
    endCall,
    remoteStreamRef,
    activeCallId
  } = useCall();
  
  const videoRef = useRef(null);

  // Show overlay only if connected/ringing AND NOT on the call page
  const isCallPage = pathname.startsWith('/app/call/');
  const shouldShow = (callState === CALL_STATES.CONNECTED || callState === CALL_STATES.RINGING) && !isCallPage;

  useEffect(() => {
    if (shouldShow && videoRef.current && remoteStreamRef.current) {
      videoRef.current.srcObject = remoteStreamRef.current;
      videoRef.current.play().catch(e => console.log('Autoplay failed', e));
    }
  }, [shouldShow, remoteStreamRef]);

  if (!shouldShow) return null;

  const handleMaximize = () => {
    if (activeCallId) {
      router.push(`/app/call/${activeCallId}`);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleMaximize}>
      <video 
        ref={videoRef}
        className={styles.video}
        autoPlay
        playsInline
        muted // Muted to prevent echo if implementing local echo, generally remote should not be muted
      />
      
      <div className={styles.controls} onClick={e => e.stopPropagation()}>
        <div className={styles.info}>
          {callerName}
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.button}
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          
          <button 
            className={`${styles.button} ${styles.endButton}`}
            onClick={endCall}
            aria-label="End call"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
