import { request } from '@/api/request'
import type { User, Task, TaskDetail, Department } from '@/types/type'
import { sha256 } from 'js-sha256'
//http情况走不了crypto.subtle，subtle在浏览器安全上下文不存在，所以用js-sha256
export async function digestPassword(password: string) {
  try {
    if (globalThis.crypto?.subtle) {
      return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))))
        .map(v => v.toString(16).padStart(2, '0')).join('')
    }
  } catch (error) { 
    //空挂着吧，相信后人智慧
   }
  return sha256(password)
}
export const login = (username:string, passwordDigest:string) => request<{token:string;user:User}>('/auth/login', {
    method:'POST',
    body:JSON.stringify({ username, password: passwordDigest })
  })
export const validateToken = (headers:Record<string,string>) => request<User | {message:string}>('/auth/me',{ headers })
export const logout = () => request<{ok:boolean}>('/auth/logout', { method:'POST' })
export const getSummary = (headers?:Record<string,string>, days?:number) => request<any>(`/dashboard/summary/${days}`, { headers })
export const getTasks = (headers?:Record<string,string>) => request<Task[]>('/tasks', { headers })
export const getTask = (id:number, headers?:Record<string,string>) => request<TaskDetail>(`/tasks/${id}`, { headers })
export const getPool = (headers?:Record<string,string>) => request<Task[]>('/tasks/public-pool', { headers })
export const createTask = (body:any, headers?:Record<string,string>) => request<Task>('/tasks', { method:'POST', headers, body:JSON.stringify(body) })
export const updateTask = (id:number, body:any, headers?:Record<string,string>) => request<Task>(`/tasks/${id}`, { method:'PUT', headers, body:JSON.stringify(body) })
export const deleteTask = (id:number, headers?:Record<string,string>) => request<{ok:boolean}>(`/tasks/${id}`, { method:'DELETE', headers })
export const claimTask = (id:number, headers?:Record<string,string>) => request<Task>(`/tasks/${id}/claim`, {method:'POST',headers,})
export const backToPool = (id:number, headers?:Record<string,string>) => request<Task>(`/tasks/${id}/backToPool`, {method:'POST',headers,})
export const reportTask = (id:number, _username:string, body:any, headers?:Record<string,string>) => request<any>(`/tasks/${id}/report`, { method:'POST', headers, body:JSON.stringify(body) })
export const getUsers = (headers?:Record<string,string>) => request<User[]>('/users', { headers })
export const createUser = (body:any, headers?:Record<string,string>) => request<User>('/users', { method:'POST', headers, body:JSON.stringify(body) })
export const updateUser = (id:number, body:any, headers?:Record<string,string>) => request<User>(`/users/${id}`, { method:'PUT', headers, body:JSON.stringify(body) })
export const deleteUser = (id:number, headers?:Record<string,string>) => request<{ok:boolean}>(`/users/${id}`, { method:'DELETE', headers })
export const getDepartments = (headers?:Record<string,string>) => request<Department[]>('/departments', { headers })
export const getApiInfo = (headers?:Record<string,string>) => request<any>('/openapi/info', { headers })
export const uploadAvatar = (id:number, body:any, headers?:Record<string,string>) => request<{ok:boolean}>(`/users/${id}/avatar`, { method:'POST', headers, body:JSON.stringify(body) })
export const getAvatar = (id:number, headers?:Record<string,string>) => request<any>(`/users/${id}/avatar`, { headers })
export const deleteAvatar = (id:number, headers?:Record<string,string>) => request<string>(`/users/${id}/avatar`, { method:'DELETE', headers })
