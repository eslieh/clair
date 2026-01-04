'use client';

import { useEffect, useRef, use } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff, X, PhoneOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCall, CALL_STATES } from '@/contexts/CallContext';
import styles from './call.module.css';

export default function CallPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);

  const { 
    callState, 
    startCall, 
    endCall, 
    isMuted, 
    toggleMute, 
    isVideoOff, 
    toggleVideo,
    localStreamRef,
    remoteStreamRef,
    callDuration,
    callerName,
    activeCallId
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Prevent re-triggering call if we've already started it or if it's ending
    if (hasAttempted.current) return;
    if (callState === CALL_STATES.ENDED) return; // Don't start if we are in ENDED state

    const isInitiator = searchParams.get('initiator') === 'true';
    const calleeId = searchParams.get('callee');
    const calleeName = searchParams.get('name') || 'User';

    if (isInitiator && calleeId && (callState === CALL_STATES.IDLE || activeCallId !== id)) {
       console.log('[CallPage] Initiating call with ID:', id);
       hasAttempted.current = true;
       startCall(calleeId, calleeName, id);
    }
  }, [id, callState, activeCallId, startCall, searchParams]);

  // Handle automatic redirection when call ends (from peer or local)
  useEffect(() => {
    if (callState === CALL_STATES.ENDED) {
      console.log('[CallPage] Call ended, redirecting in 2s...');
      const timer = setTimeout(() => {
        router.replace('/app/calls');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [callState, router]);

  useEffect(() => {
    const syncStreams = () => {
      if (localVideoRef.current && localStreamRef.current && localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStreamRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    syncStreams();
  }, [callState, localStreamRef.current, remoteStreamRef.current]);

  const handleEndCall = () => {
    endCall();
    // Redirect is now handled by the useEffect above for consistency
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderCallStatus = () => {
    switch(callState) {
      case CALL_STATES.DIALING:
        return 'Dialing...';
      case CALL_STATES.RINGING:
        return 'Ringing...';
      case CALL_STATES.CONNECTING:
        return 'Connecting...';
      case CALL_STATES.UNAVAILABLE:
        return 'Unavailable';
      case CALL_STATES.ENDED:
        return 'Call ended';
      default:
        return formatDuration(callDuration);
    }
  };

  return (
    <div className={styles.callContainer}>
      {/* Remote Video Feed (Full Screen) */}
      <div className={`${styles.videoContainer} ${callState === CALL_STATES.CONNECTED ? styles.active : ''}`}>
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className={styles.remoteVideo}
          style={{ display: callState === CALL_STATES.CONNECTED ? 'block' : 'none' }}
        />
        
        {/* Call Status Overlay */}
        {callState !== CALL_STATES.CONNECTED && (
          <div className={styles.statusOverlay}>
            <div className={styles.callerInfo}>
              <div className={styles.callerAvatar}>
                {searchParams.get('avatar') ? (
                  <img src={searchParams.get('avatar')} alt="" className={styles.avatarImg} />
                ) : (
                  (callerName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <h1 className={styles.callerName}>{callerName}</h1>
              <p className={styles.callStatus}>{renderCallStatus()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video Feed (PIP within the page) */}
      <div className={styles.localVideoContainer} style={{ display: callState === CALL_STATES.CONNECTED ? 'block' : 'none' }}>
        <video 
          ref={localVideoRef} 
          autoPlay 
          muted 
          playsInline 
          className={`${styles.localVideo} ${isVideoOff ? styles.videoOff : ''}`}
        />
        {isVideoOff && (
          <div className={styles.videoOffOverlay}>
            <div className={styles.videoOffIcon}>
              <VideoOff size={24} />
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className={styles.callControls}>
        <div className={styles.callInfo}>
          <h2 className={styles.callInfoName}>{callerName}</h2>
          <p className={styles.callInfoStatus}>{renderCallStatus()}</p>
        </div>
        
        <div className={styles.controlButtons}>
          <button 
            className={`${styles.controlButton} ${isMuted ? styles.active : ''}`}
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            className={`${styles.controlButton} ${isVideoOff ? styles.active : ''} ${styles.videoButton}`}
            onClick={toggleVideo}
            aria-label={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
          
          <button 
            className={`${styles.controlButton} ${styles.endCallButton}`}
            onClick={handleEndCall}
            aria-label="End call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
