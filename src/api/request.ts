import { refreshToken } from '@/api/refresh/refreshToken'
import { useAuthStore } from '@/stores/auth'

// 生产env下baseUrl不参与fetch请求，依赖nginx反向代理配置。本地开发env简单拼接
export const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
export const base = import.meta.env.VITE_API_BASE || `${baseUrl}/api`

export function sessionHeaders(): Record<string,string> {
  const token = localStorage.getItem('abyss-session');
  return token ? { 'X-Auth-Token': JSON.parse(token).token as string } : {}
}

export async function request<T>(path:string, options:RequestInit = {}, fallback?:T): Promise<T> {
  try {
    const headers = new Headers({
        'Accept':'application/json',
        'Content-Type':'application/json',...sessionHeaders()
      })
    new Headers(options.headers).forEach((value, key) => headers.set(key, value))
    const response = await fetch(`${base}${path}`, { ...options, headers })
    if (!response.ok) {//4xx
      const error = new Error(await response.text()) as Error & { status?: number ,step?:string ,message?:string}
      if (JSON.parse(error.message).message == 'expiredToken') {
        //刷新tokens
        const ok = await refreshToken()
        if (!ok) throw new Error('refreshError')
        const authStore = useAuthStore()
        return await request<T>(path, { ...options, headers: { 'X-Auth-Token': authStore.token } },fallback);
      } else{
      error.status = response.status
      error.step = 'request'
      throw error
      }
    }
    //响应体为空时
    if (response.status === 204) return undefined as T

    const contentType = response.headers.get('content-type') || ''
    return (contentType.includes('application/json') ? await response.json() : await response.text()) as T
   } catch (error) {
    if (fallback !== undefined && !(error as { status?: number }).status) return fallback
    throw error
  }
}