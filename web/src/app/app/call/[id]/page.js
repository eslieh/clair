'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff, Video, VideoOff, X, PhoneOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './call.module.css';

const CALL_STATES = {
  DIALING: 'dialing',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  UNAVAILABLE: 'unavailable',
  ENDED: 'ended'
};

export default function CallPage({ params }) {
  const router = useRouter();
  const [callState, setCallState] = useState(CALL_STATES.DIALING);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callerName, setCallerName] = useState('John Doe'); // Replace with actual contact name
  
  // Simulate call progress
  useEffect(() => {
    if (callState === CALL_STATES.DIALING) {
      const timer = setTimeout(() => setCallState(CALL_STATES.RINGING), 1000);
      return () => clearTimeout(timer);
    } else if (callState === CALL_STATES.RINGING) {
      const timer = setTimeout(() => setCallState(CALL_STATES.CONNECTING), 2000);
      return () => clearTimeout(timer);
    } else if (callState === CALL_STATES.CONNECTING) {
      const timer = setTimeout(() => setCallState(CALL_STATES.CONNECTED), 1500);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  // Simulate call timer
  useEffect(() => {
    let interval;
    if (callState === CALL_STATES.CONNECTED) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Get user media for local video
  useEffect(() => {
    if (localVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          localVideoRef.current.srcObject = stream;
          // For demo, we'll use the same stream for remote video
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream.clone();
          }
        })
        .catch(err => console.error('Error accessing media devices:', err));
    }

    return () => {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const endCall = () => {
    setCallState(CALL_STATES.ENDED);
    setTimeout(() => {
      router.push('/app');
    }, 1000);
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
                {callerName.charAt(0).toUpperCase()}
              </div>
              <h1 className={styles.callerName}>{callerName}</h1>
              <p className={styles.callStatus}>{renderCallStatus()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video Feed (PIP) */}
      {callState === CALL_STATES.CONNECTED && (
        <div className={styles.localVideoContainer}>
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
      )}

      {/* Call Controls */}
      <div className={styles.callControls}>
        <div className={styles.callInfo}>
          <h2 className={styles.callInfoName}>{callerName}</h2>
          <p className={styles.callInfoStatus}>{renderCallStatus()}</p>
        </div>
        
        <div className={styles.controlButtons}>
          <button 
            className={`${styles.controlButton} ${isMuted ? styles.active : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          {callState === CALL_STATES.CONNECTED && (
            <button 
              className={`${styles.controlButton} ${isVideoOff ? styles.active : ''} ${styles.videoButton}`}
              onClick={() => setIsVideoOff(!isVideoOff)}
              aria-label={isVideoOff ? 'Turn on video' : 'Turn off video'}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}
          
          <button 
            className={`${styles.controlButton} ${styles.endCallButton}`}
            onClick={endCall}
            aria-label="End call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
