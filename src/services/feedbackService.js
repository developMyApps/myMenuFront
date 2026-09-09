// src/services/feedbackService.js
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Crear un nuevo ticket desde el grupo
export async function createTicket(groupId, ticketData) {
    const response = await fetch(`${API_URL}/groups/${groupId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
    })

    if (!response.ok) {
        throw new Error('Error al enviar el reporte.')
    }
    return await response.json()
}

// Obtener los tickets de un grupo con sus respuestas
export async function getGroupTickets(groupId) {
    const response = await fetch(`${API_URL}/groups/${groupId}/tickets`)

    if (!response.ok) {
        throw new Error('Error al obtener las incidencias.')
    }
    return await response.json()
}

// Responder a un ticket (usuario)
export async function replyToTicket(ticketId, message) {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/replies?sender_type=user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })

    if (!response.ok) {
        throw new Error('Error al responder al ticket.')
    }
    return await response.json()
}