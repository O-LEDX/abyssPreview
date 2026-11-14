import { sessionHeaders, base } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { clearValidTokenCache } from '@/static/authValid'

export async function refreshToken() {
  const headers = new Headers({
    'Accept':'application/json',
    'Content-Type':'application/json',...sessionHeaders()
  })
  const authStore = useAuthStore()
  const toastStore = useToastStore()
  try{
  const username = authStore.user?.username || null
  const response = await fetch(`${base}/auth/refresh`, { method:'POST', headers ,body:JSON.stringify({"username": username})})
  if (response.ok) {
    const res = await response.json();
    authStore.token = res.token;
    authStore.user = res.user;
    localStorage.setItem('abyss-session', JSON.stringify({ token: authStore.token, user: authStore.user }))
    clearValidTokenCache()
    return true;
  } else{
  await authStore.signOut();
  toastStore.show('已退出登录',2000);
  return false;
  }
  } catch (error) {
    throw error
  }
}