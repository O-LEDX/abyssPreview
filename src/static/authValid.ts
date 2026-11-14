//缓存+请求的方式，最后返回一个返回体
//cache 记在顶层变量
import {useAuthStore} from '@/stores/auth'
let validTokenCache:boolean | null = null;

export async function validateToken() {
  if(validTokenCache){
    return validTokenCache
  }else{
    try{
    const auth = useAuthStore()
      validTokenCache = await auth.validToken()
      return true
    }catch(err){
      return false
    }
  }
}
export function clearValidTokenCache() {
  validTokenCache = null
}