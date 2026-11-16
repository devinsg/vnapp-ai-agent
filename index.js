import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.set('port', process.env.PORT || 5001);
app.set('host', process.env.HOST || 'localhost');
app.set('secretKey', process.env.SECRET_KEY || 'vnapp-ai');

// Khởi tạo SDK Gemini chính thức
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
// gemini-3.5-flash-lite | gemini-3.1-flash-lite | gemini-3.6-flash  | gemini-3.8-flash

// ==========================================
// 1. ĐỊNH NGHĨA CÔNG CỤ (TOOLS) CHO AGENT
// ==========================================
const queryAttendanceTool = {
  name: "queryAttendance",
  description: "Tra cứu dữ liệu chấm công của nhân viên từ SQL Server dựa vào tên.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      employeeName: { type: Type.STRING, description: "Tên nhân viên cần tra cứu" }
    },
    required: ["employeeName"],
  },
};

// Hàm thực thi thực tế của Tool
function executeAttendanceQuery(employeeName) {
  console.log(`[SQL Tool Executed] Đang query dữ liệu cho: ${employeeName}`);
  return {
    employee: employeeName,
    month: "11/2026",
    workDays: 22,
    status: "Đầy đủ, không đi muộn"
  };
}

// Gom các tools vào danh sách cấu hình
const tools = [{ functionDeclarations: [queryAttendanceTool] }];

// ==========================================
// 2. ENDPOINT API CHO FRONTEND GỌI
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Khởi tạo một phiên Chat Session (giúp SDK tự quản lý state và thought_signature)
        const chat = ai.chats.create({
          model: GEMINI_MODEL,
          config: {
            tools: tools,
            thinkingConfig: {
              thinkingBudget: 0,
            },
            systemInstruction: "Bạn là trợ lý AI nhân sự. Hãy phân tích câu hỏi và gọi tool tương ứng nếu cần thiết.",
          }
        });

        // Gửi tin nhắn đầu tiên từ user vào phiên chat
        let response = await chat.sendMessage({ message: prompt });

        // Kiểm tra xem Agent có muốn gọi Tool hay không
        if (response.functionCalls && response.functionCalls.length > 0) {
          const call = response.functionCalls[0];
          let toolResult = "";

          // Nếu Agent gọi đúng tool queryAttendance
          if (call.name === "queryAttendance") {
              const args = call.args;
              console.log('args:', args);
              toolResult = executeAttendanceQuery(args.employeeName);
          }

          // Gửi kết quả thực thi từ Tool ngược lại vào chat session
          // SDK sẽ tự động đính kèm thought_signature và gọi tiếp Gemini để tổng hợp câu trả lời
          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: call.name,
                response: { result: toolResult }
              }
            }]
          });
        }

        // Trả kết quả cuối cùng về cho Client
        return res.json({ reply: response.text });

    } catch (error) {
        console.error("Lỗi:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/status', function (req, res) {
  return res.status(200).json({
    status: true,
    timestamp: new Date().toISOString(),
  });
});

const PORT = app.get('port');
const HOST = app.get('host');
app.listen(PORT, () => {
  console.log(`Backend Agent đang chạy tại http://${HOST}:${PORT}`);
});
