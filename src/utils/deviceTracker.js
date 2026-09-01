import apiClient from '../services/apiClient'

export const getDeviceId = () => {
  let deviceId = localStorage.getItem('kitchenDeviceId')
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
    localStorage.setItem('kitchenDeviceId', deviceId)
  }
  return deviceId
}

export const getDeviceName = () => {
  const userAgent = navigator.userAgent
  let name = 'Dispositivo Web'
  if (/iPhone|iPad|iPod/i.test(userAgent)) name = 'iPhone / iOS'
  else if (/Android/i.test(userAgent)) name = 'Android'
  else if (/Mac/i.test(userAgent)) name = 'Mac'
  else if (/Windows/i.test(userAgent)) name = 'Windows PC'
  return name
}

export const pingGroupDevice = async (groupId) => {
  if (!groupId) return
  try {
    const device_id = getDeviceId()
    const device_name = getDeviceName()
    await apiClient.post(`/groups/${groupId}/devices/ping`, { device_id, device_name })
  } catch (err) {
    // Ping silencioso, no interrumpe al usuario si falla
    console.debug('Ping de dispositivo fallido:', err)
  }
}
