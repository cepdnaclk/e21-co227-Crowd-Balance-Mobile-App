const axios = require('axios');

// Your n8n webhook URL - UPDATE THIS
// const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://ridmal.app.n8n.cloud/webhook-test/87e75c26-5a46-4b20-ac6f-756094ebe547';
const N8N_WEBHOOK_URL = 'https://ridmal2.app.n8n.cloud/webhook/c7b46a2a-decc-42ef-b401-c0fef57ef63e';


// Send message to n8n chatbot
exports.sendMessage = async (req, res) => {
  try {
    console.log('Received chat request:', req.body);
    
    const { message, sessionId, userId } = req.body;

    // Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Send message to n8n
    const response = await axios.post(N8N_WEBHOOK_URL, {
      message: message.trim(),
      sessionId: sessionId || 'default',
      userId: userId || null,
      timestamp: new Date().toISOString()
    }, {
      timeout: 25000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('n8n response:', response.data);

    // Extract reply from n8n response
    const reply = response.data.reply || 
                  response.data.output || 
                  response.data.message || 
                  response.data.text ||
                  'I received your message!';

    res.json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout. Please try again.'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: 'Failed to get chatbot response',
        details: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get chatbot response',
      details: error.message
    });
  }
};

// Health check for chat service
exports.healthCheck = (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Chat service is running',
    n8nConfigured: !!N8N_WEBHOOK_URL,
    timestamp: new Date().toISOString()
  });
};