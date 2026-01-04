'use client';

import { useState, useEffect, useTransition } from 'react';
import { Search, X, Video, UserPlus, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { searchUsers, getContacts, addContact } from '@/app/app/calls/actions'; // We can use server actions in client components via import or pass them down
import styles from './NewCallModal.module.css'; // We'll create this CSS module
import { useCall } from '@/contexts/CallContext';

export default function NewCallModal({ onClose }) {
  const router = useRouter();
  const { startCall } = useCall();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isSearching, startTransition] = useTransition();

  useEffect(() => {
    // Load initial contacts
    getContacts().then(setContacts);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    // Debounce search
    const timer = setTimeout(() => {
      startTransition(async () => {
        const users = await searchUsers(query);
        setResults(users);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleStartCall = (user) => {
    // We just navigate to the call page with initiator=true.
    // The CallPage will trigger startCall in the context.
    const tempId = crypto.randomUUID();
    const avatar = user.avatar_url ? `&avatar=${encodeURIComponent(user.avatar_url)}` : '';
    router.push(`/app/call/${tempId}?callee=${user.id}&initiator=true&name=${encodeURIComponent(user.display_name)}${avatar}`);
    onClose();
  };

  const handleAddContact = async (e, user) => {
    e.stopPropagation();
    await addContact(user.id);
    // Optimistically update
    setContacts(prev => [...prev, user]);
  };
  
  const isContact = (id) => contacts.some(c => c.id === id);

  const displayList = query.length >= 2 ? results : contacts;
  const listTitle = query.length >= 2 ? 'Search Results' : 'Suggested';

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>New Clair Call</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.searchWrap}>
          <label className={styles.toLabel}>To:</label>
          <input
            className={styles.input}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name or username"
          />
          {isSearching && <div className={styles.searchingIndicator} />}
        </div>

        <div className={styles.listContainer}>
          <h3 className={styles.listTitle}>{listTitle}</h3>
          
          <div className={styles.grid}>
            {displayList.map(user => (
              <div 
                key={user.id} 
                className={styles.userCard}
                onClick={() => handleStartCall(user)}
              >
                <div className={styles.avatar}>
                   <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.display_name}&background=random`} 
                      alt="" 
                      className={styles.avatarImg}
                    />
                </div>
                <div className={styles.userName}>{user.display_name}</div>
                
                {/* Optional interaction buttons if we want them directly on card, 
                    but simpler to just click card to call */}
                {!isContact(user.id) && (
                  <button 
                    className={styles.addContactBtn}
                    onClick={(e) => handleAddContact(e, user)}
                    title="Add to contacts"
                  >
                    <UserPlus size={14} />
                  </button>
                )}
              </div>
            ))}
            
            {displayList.length === 0 && !isSearching && (
              <div className={styles.emptyState}>
                {query.length < 2 && contacts.length === 0 
                  ? "No contacts yet. Search to add someone!"
                  : "No people found."}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.footer}>
           <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
           {/* Primary action is usually context dependent, keeping it simple for now */}
        </div>
      </div>
    </div>
  );
}
