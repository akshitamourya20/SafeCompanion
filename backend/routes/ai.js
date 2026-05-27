const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Dynamic hot-swap loaders
let Chat = require('../models/Chat');
let User = require('../models/User');

router.use((req, res, next) => {
  if (global.useLocalDB) {
    Chat = require('../config/localDb').chats;
    User = require('../config/localDb').users;
  } else {
    Chat = require('../models/Chat');
    User = require('../models/User');
  }
  next();
});

// List of high-risk keywords that trigger distress warnings
const DANGER_KEYWORDS = [
  'help', 'sos', 'screaming', 'follow', 'following', 'scared', 'afraid', 'unsafe', 
  'bachao', 'danger', 'stranger', 'attack', 'kidnap', 'run', 'emergency', 'dark alley'
];

// Fallback safety agent responses when Gemini API Key is missing
const getAIFallbackResponse = (message, username) => {
  const lowercaseMsg = message.toLowerCase();
  
  // Rule 1: Emergency SOS triggered
  if (DANGER_KEYWORDS.some(keyword => lowercaseMsg.includes(keyword))) {
    return {
      text: `⚠️ WARNING: Potential distress detected! ${username}, please remain calm. I am immediately preparing an AI Emergency SOS message, initiating Anonymous AI Deterrent Call, and sharing your live GPS coordinates with your emergency contacts! 

Please tap the SOS button on your screen if you need immediate loud alarms. I am monitoring your status continuously.`,
      isEmergency: true
    };
  }

  // Rule 2: Walking alone or dark route
  if (lowercaseMsg.includes('alone') || lowercaseMsg.includes('dark') || lowercaseMsg.includes('walk') || lowercaseMsg.includes('night')) {
    return {
      text: `Understood, ${username}. Walking alone at night can be stressful. Let me activate "Active Escort Mode". I'll trigger check-ins every 2 minutes. 

Here are safety recommendations:
1. Hold your phone firmly in your hand with the SafeCompanion app open.
2. Keep your headphones out so you are fully aware of your surroundings.
3. Walk in well-lit areas, even if it adds 5 minutes to your journey.
4. I have prepared the "Anonymous AI Call" to play whenever you feel a stranger getting too close. Would you like me to trigger a mock family call now?`,
      isEmergency: false
    };
  }

  // Rule 3: Corporate night shift questions
  if (lowercaseMsg.includes('shift') || lowercaseMsg.includes('office') || lowercaseMsg.includes('cab') || lowercaseMsg.includes('hr')) {
    return {
      text: `As your SafeCompanion, I am fully integrated with your company's HR Safety desk. If you are boarding a night shift cab:
1. Ensure the driver's details match the HR SMS.
2. Send your Live Map link to your co-workers.
3. If the cab deviates from the route, our LSTM anomaly detector will automatically alert HR. Stay safe!`,
      isEmergency: false
    };
  }

  // Rule 4: General greeting
  return {
    text: `Hello ${username}! I am your SafeCompanion AI Guardian. I monitor your routes, track movement anomalies, and stand ready to trigger emergency protocols. 

Tell me, where are you heading tonight, or are you feeling unsafe in your current location? I'm here with you all the way.`,
    isEmergency: false
  };
};

// @route   POST /api/ai/chat
// @desc    Process safety companion chat message (uses Gemini or Smart Fallback)
// @access  Private
router.post('/chat', protect, async (req, res) => {
  const { message, chatSessionId } = req.body;
  const username = req.user.username;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Please provide a message' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponseText = '';
    let isEmergency = DANGER_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword));

    if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        // Direct REST API Call to Gemini 1.5 Flash using built-in fetch
        const systemPrompt = `You are "SafeCompanion", an agentic AI Safety Assistant developed for women safety (Capgemini Buildathon 2026).
        Your user is ${username}. Your purpose is to act as an active guardian.
        - If the user indicates they are in DANGER (e.g. followed, cornered, screaming, emergency), immediately reply with a clear, direct, and supportive message starting with a "⚠️ WARNING: Potential distress detected!" and let them know you are triggering emergency alarms, Anonymous TTS call, and SMS alerts.
        - If the user is commuting, offer proactive safety check-ins, well-lit route recommendations, and suggest using the "Anonymous AI Deterrent Call" or "Stealth Disguise Calculator".
        - Keep your responses practical, concise, protective, and empowering. Avoid generic chatbot pleasantries. Focus on actionable safety steps.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nUser Message: ${message}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 250
            }
          })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
          aiResponseText = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Invalid response structure from Gemini API');
        }
      } catch (geminiError) {
        console.error('Gemini API call failed, using smart rule engine fallback:', geminiError.message);
        const fallback = getAIFallbackResponse(message, username);
        aiResponseText = fallback.text;
        isEmergency = isEmergency || fallback.isEmergency;
      }
    } else {
      // No API key provided, use stateful smart fallback directly
      const fallback = getAIFallbackResponse(message, username);
      aiResponseText = fallback.text;
      isEmergency = isEmergency || fallback.isEmergency;
    }

    // Save chat session
    let chat;
    if (chatSessionId) {
      chat = await Chat.findById(chatSessionId);
    }

    if (!chat) {
      if (global.useLocalDB) {
        chat = Chat.create({
          user: req.user._id,
          messages: []
        });
      } else {
        chat = new Chat({
          user: req.user._id,
          messages: []
        });
      }
    }

    // Add user message
    chat.messages.push({
      sender: 'user',
      text: message,
      timestamp: Date.now()
    });

    // Add AI response
    chat.messages.push({
      sender: 'assistant',
      text: aiResponseText,
      timestamp: Date.now()
    });

    await chat.save();

    // If an emergency is triggered, update the user status to "SOS Active" or "Anomaly Detected"
    if (isEmergency && req.user.status !== 'SOS Active') {
      req.user.status = 'SOS Active';
      await req.user.save();
    }

    res.json({
      success: true,
      chatSessionId: chat._id,
      reply: aiResponseText,
      isEmergency,
      userStatus: req.user.status
    });

  } catch (error) {
    console.error('AI chat endpoint error:', error);
    res.status(500).json({ success: false, error: 'Server AI processing error' });
  }
});

// @route   GET /api/ai/chats
// @desc    Get user's past chat sessions
// @access  Private
router.get('/chats', protect, async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id });
    res.json({ success: true, count: chats.length, chats });
  } catch (error) {
    console.error('Fetch chats error:', error);
    res.status(500).json({ success: false, error: 'Server chat fetch error' });
  }
});

module.exports = router;
