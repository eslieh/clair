'use client';

import { useCall } from '@/contexts/CallContext';
import styles from '../routes.module.css';
import { Video } from 'lucide-react';

export default function CallsPage() {
  const { startCall } = useCall(); // optional if we want a big button

  return (
   <></>
  );
}
