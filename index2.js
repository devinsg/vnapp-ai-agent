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

// Khởi tạo SDK Gemini chính thức (Sử dụng API key miễn phí từ Google AI Studio)
// Lấy key tại: https://aistudio.google.com/
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
  // Giả lập kết quả trả về từ cơ sở dữ liệu SQL Server
  console.log(`[SQL Tool Executed] Đang query dữ liệu cho: ${employeeName}`);
  return JSON.stringify({
    employee: employeeName,
    month: "11/2026",
    workDays: 22,
    status: "Đầy đủ, không đi muộn"
  });
}

// Gom các tools vào danh sách
const tools = [{ functionDeclarations: [queryAttendanceTool] }];

// ==========================================
// 2. ENDPOINT API CHO FRONTEND GỌI
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        // Gọi Gemini Flash (Model tối ưu, nhanh và miễn phí cho dev)
        const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          tools: tools,
          thinkingConfig: {
            thinkingBudget: 0,
          },
          systemInstruction: "Bạn là trợ lý AI nhân sự. Hãy phân tích câu hỏi và gọi tool tương ứng nếu cần thiết.",
        }
        });

        // Kiểm tra xem Agent có muốn gọi Tool hay không
        const functionCalls = response.functionCalls;
        
        if (functionCalls && functionCalls.length > 0) {
          const call = functionCalls[0];
          let toolResult = "";

          // Nếu Agent gọi đúng tool queryAttendance
          if (call.name === "queryAttendance") {
              const args = call.args;
              console.log('args:', args);
              toolResult = executeAttendanceQuery(args.employeeName);
          }

          // Gửi kết quả từ Tool ngược lại cho Gemini để nó tổng hợp thành câu trả lời hoàn chỉnh
          const finalResponse = await ai.models.generateContent({
              model: GEMINI_MODEL,
              contents: [
              { role: 'user', parts: [{ text: prompt }] },
              { role: 'model', parts: [{ functionCall: call }] },
              { role: 'function', parts: [{ functionResponse: { name: call.name, response: { result: toolResult } } }] }
              ]
          });

          return res.json({ reply: finalResponse.text });
        };

        // Trường hợp câu hỏi thông thường không cần gọi tool
        res.json({ reply: response.text });

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
  console.log(`Backend Agent đang chạy tại ${HOST} cổng ${PORT}`);
});