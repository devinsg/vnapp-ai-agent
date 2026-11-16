import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Gửi câu hỏi đến Backend Node.js
      const res = await axios.post('http://localhost:5001/api/chat', { prompt: input });
      const botMessage = { sender: 'bot', text: res.data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Lỗi kết nối đến Agent Server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>🤖 Enterprise AI Agent (Gemini Powered)</h2>
      <div style={{ border: '1px solid #ccc', height: '400px', overflowY: 'scroll', padding: '15px', marginBottom: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '10px 0' }}>
            <span style={{ 
              display: 'inline-block', 
              padding: '10px 14px', 
              borderRadius: '10px', 
              background: msg.sender === 'user' ? '#007bff' : '#e4e6eb',
              color: msg.sender === 'user' ? '#fff' : '#000'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: '#666', fontStyle: 'italic' }}>Agent đang suy nghĩ và kiểm tra dữ liệu...</p>}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Hỏi về nhân viên (Ví dụ: Chấm công của nhân viên Nguyễn Văn A?)..." 
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Gửi
        </button>
      </form>
    </div>
  );
}

export default App;