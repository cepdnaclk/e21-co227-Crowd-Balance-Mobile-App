import axios from 'axios';
import { API_BASE_URL } from '../config'; // ← Make sure this import is correct

class ChatService {
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendMessage(message, userId = null) {
    try {
      // Use API_BASE_URL, not API_URL
      console.log('Sending message to:', `${API_BASE_URL}/api/chat`);
      
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: message,
        sessionId: this.sessionId,
        userId: userId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('Chat response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Chat service error:', error.response?.data || error.message);
      throw error;
    }
  }

  resetSession() {
    this.sessionId = this.generateSessionId();
  }
}

export default new ChatService();