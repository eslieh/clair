'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch or create profile
  let { data: profile } = await supabase
    .from('profile')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile exists yet (first login), we might want to return basic user info
  // or handle it gracefully. The trigger usually creates it, but if manual:
  if (!profile) {
    // Return a transient profile object based on auth data
    return {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || '',
      username: '',
      status: '',
      avatar_url: '',
    }
  }

  return { ...profile, email: user.email }
}

export async function updateProfile(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const displayName = formData.get('displayName')
  const username = formData.get('username')
  const status = formData.get('status')
  const avatarUrl = formData.get('avatarUrl')

  const { error } = await supabase
    .from('profile')
    .upsert({
      id: user.id,
      display_name: displayName,
      username: username,
      status: status,
      avatar_url: avatarUrl,
      // last_seen will be updated by presence logic elsewhere usually
    })

  if (error) {
    console.error('Profile update error:', error)
    return { error: 'Could not update profile' }
  }

  revalidatePath('/app/account')
  return { success: true }
}
