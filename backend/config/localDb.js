const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  reports: path.join(DATA_DIR, 'reports.json'),
  chats: path.join(DATA_DIR, 'chats.json'),
  evidence: path.join(DATA_DIR, 'evidence.json') // Added Evidence Vault storage file!
};

// Initialize empty JSON files if they don't exist
Object.entries(FILES).forEach(([key, filepath]) => {
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify([], null, 2), 'utf-8');
  }
});

const readData = (type) => {
  try {
    const content = fs.readFileSync(FILES[type], 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${type} local DB:`, err);
    return [];
  }
};

const writeData = (type, data) => {
  try {
    fs.writeFileSync(FILES[type], JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${type} local DB:`, err);
  }
};

const localDb = {
  // --- USER API ---
  users: {
    find: async (query = {}) => {
      const users = readData('users');
      if (query.role === 'user') {
        return users.filter(u => u.role === 'user');
      }
      return users;
    },
    
    findOne: async (query) => {
      const users = readData('users');
      if (query.$or) {
        const { email, username } = query.$or.reduce((acc, current) => ({ ...acc, ...current }), {});
        return users.find(u => u.email === email || u.username === username) || null;
      }
      if (query.email) {
        return users.find(u => u.email === query.email) || null;
      }
      return null;
    },
    
    findById: async (id) => {
      const users = readData('users');
      const user = users.find(u => u._id === id.toString() || u.id === id.toString());
      if (!user) return null;
      
      return {
        ...user,
        save: async function() {
          const allUsers = readData('users');
          const idx = allUsers.findIndex(u => u._id === this._id);
          if (idx !== -1) {
            allUsers[idx] = {
              _id: this._id,
              username: this.username,
              email: this.email,
              password: this.password,
              role: this.role,
              shiftTime: this.shiftTime,
              status: this.status,
              emergencyContacts: this.emergencyContacts,
              location: this.location,
              createdAt: this.createdAt
            };
            writeData('users', allUsers);
          }
          return this;
        }
      };
    },
    
    create: async (userData) => {
      const users = readData('users');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const newUser = {
        _id: 'local_' + Date.now().toString(),
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'user',
        shiftTime: userData.shiftTime || '22:00 - 06:00',
        emergencyContacts: userData.emergencyContacts || [],
        status: 'Safe',
        location: { lat: 12.9716, lng: 77.5946, updatedAt: new Date() },
        createdAt: new Date()
      };
      
      users.push(newUser);
      writeData('users', users);
      return newUser;
    }
  },

  // --- SAFETY REPORTS API ---
  reports: {
    find: async () => {
      return readData('reports');
    },
    
    create: async (reportData) => {
      const reports = readData('reports');
      const newReport = {
        _id: 'report_' + Date.now().toString(),
        title: reportData.title,
        description: reportData.description,
        type: reportData.type,
        location: reportData.location,
        reporter: reportData.reporter || null,
        createdAt: new Date()
      };
      reports.push(newReport);
      writeData('reports', reports);
      return newReport;
    },
    
    insertMany: async (reportList) => {
      const reports = readData('reports');
      const formatted = reportList.map((r, index) => ({
        _id: 'report_seed_' + index + '_' + Date.now().toString(),
        title: r.title,
        description: r.description,
        type: r.type,
        location: r.location,
        reporter: null,
        createdAt: new Date()
      }));
      const merged = [...reports, ...formatted];
      writeData('reports', merged);
      return formatted;
    }
  },

  // --- CHAT API ---
  chats: {
    find: async (query = {}) => {
      const chats = readData('chats');
      if (query.user) {
        return chats.filter(c => c.user === query.user.toString()).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return chats;
    },
    
    findById: async (id) => {
      const chats = readData('chats');
      const chat = chats.find(c => c._id === id.toString());
      if (!chat) return null;
      
      return {
        ...chat,
        save: async function() {
          const allChats = readData('chats');
          const idx = allChats.findIndex(c => c._id === this._id);
          if (idx !== -1) {
            allChats[idx] = {
              _id: this._id,
              user: this.user,
              messages: this.messages,
              createdAt: this.createdAt
            };
            writeData('chats', allChats);
          }
          return this;
        }
      };
    },
    
    create: function(chatData) {
      const chats = readData('chats');
      const newChat = {
        _id: 'chat_' + Date.now().toString(),
        user: chatData.user.toString(),
        messages: chatData.messages || [],
        createdAt: new Date()
      };
      
      chats.push(newChat);
      writeData('chats', chats);
      
      return {
        ...newChat,
        save: async function() {
          const allChats = readData('chats');
          const idx = allChats.findIndex(c => c._id === this._id);
          if (idx !== -1) {
            allChats[idx] = this;
            writeData('chats', allChats);
          }
          return this;
        }
      };
    }
  },

  // --- AI EVIDENCE VAULT API ---
  evidence: {
    find: async (query = {}) => {
      const allEv = readData('evidence');
      if (query.user) {
        return allEv.filter(e => e.user === query.user.toString());
      }
      return allEv;
    },
    
    create: async (evData) => {
      const allEv = readData('evidence');
      const newEv = {
        _id: 'evidence_' + Date.now().toString(),
        user: evData.user.toString(),
        username: evData.username,
        timestamp: new Date(),
        audioLength: evData.audioLength || '0:15',
        transcript: evData.transcript || 'Ambient noise captured.',
        encryptedHash: 'AES256_' + Math.random().toString(36).substring(2, 15) // Simulated high-security encryption signature
      };
      
      allEv.push(newEv);
      writeData('evidence', allEv);
      return newEv;
    }
  }
};

module.exports = localDb;
