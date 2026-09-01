import apiClient from './apiClient'

const getHeaders = () => {
  const userSession = localStorage.getItem('userSession')
  let role = 'superadmin'
  let id = ''
  if (userSession) {
    try {
      const user = JSON.parse(userSession)
      role = user.role || 'superadmin'
      id = user.id || ''
    } catch (e) {}
  }
  return {
    headers: {
      'X-User-Role': role,
      'X-User-ID': id
    }
  }
}

export const getGroups = async () => {
  const response = await apiClient.get('/admin/groups', getHeaders())
  return response.data
}

export const deleteGroup = async (groupId) => {
  const response = await apiClient.delete(`/admin/groups/${groupId}`, getHeaders())
  return response.data
}

export const getPendingUsers = async () => {
  const response = await apiClient.get('/admin/pending-users', getHeaders())
  return response.data
}

export const approveUser = async (userId) => {
  const response = await apiClient.post(`/admin/users/${userId}/approve`, {}, getHeaders())
  return response.data
}

export const rejectUser = async (userId) => {
  const response = await apiClient.delete(`/admin/users/${userId}/reject`, getHeaders())
  return response.data
}

export const getSuperadmins = async () => {
  const response = await apiClient.get('/admin/superadmins', getHeaders())
  return response.data
}

export const revokeSuperadmin = async (userId) => {
  const response = await apiClient.delete(`/admin/superadmins/${userId}`, getHeaders())
  return response.data
}
