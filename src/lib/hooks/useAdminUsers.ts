import { useQuery } from '@tanstack/react-query'
import { apiRoutes } from '../api'

export function useAdminUsers(params?: {
  role?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => apiRoutes.adminUsers(params),
  })
}
