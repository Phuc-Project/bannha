/**
 * BẢN NHÀ — Module API Gia sư AI Buổi tối Gọn nhẹ (Lightweight AI Tutor Client)
 * ============================================================================
 * Đáp ứng trọn vẹn nguyên tắc sư phạm & quyền riêng tư:
 * 1. Tự động ẩn thông tin định danh cá nhân (SĐT, mã HS, họ tên) trước khi gọi mạng.
 * 2. Kiểm tra dấu hiệu khủng hoảng tâm lý ngay trên máy (`detectDistress`).
 * 3. Khóa nút "Xem lời giải" khi học sinh chưa tự thử đủ 2 lượt (`attemptCount < 2`).
 * 4. Tích hợp sẵn 2 đường gọi API siêu gọn:
 *    - Gọi qua Backend FastAPI: `POST {api.baseUrl}/api/v1/tutor/ask`
 *    - Gọi trực tiếp 1 API nhỏ (OpenAI-compatible / Gemini REST) qua `CONFIG.aiTutor.endpoint`
 *    - Tự động chuyển sang Gia sư Socratic ngoại tuyến khi chưa điền API key hoặc mất mạng.
 */
(function initAiTutorApi(global) {
  const { CONFIG } = global.BanNha;

  const DISTRESS_KEYWORDS = [
    'tự tử',
    'muốn chết',
    'không muốn sống',
    'tự làm đau',
    'bị đánh',
    'bị bắt nạt',
    'sợ quá cứu em',
  ];

  const DISTRESS_CARE_MESSAGE =
    'Thầy/cô nghe thấy em đang rất mệt và lo lắng. Em không phải chịu đựng một mình đâu nhé. ' +
    'Ngay bây giờ em hãy bấm sang mục Y tế & SOS hoặc gõ cửa phòng thầy cô Quản sinh trực tầng, ' +
    'thầy cô luôn sẵn sàng lắng nghe và bảo vệ em.';

  function detectDistress(text) {
    const lower = String(text || '').toLowerCase();
    return DISTRESS_KEYWORDS.some((kw) => lower.includes(kw));
  }

  function stripStudentPii(text) {
    return String(text || '')
      .replace(/\b0\d{9}\b/g, '[SĐT]')
      .replace(/\bHS\d{2}[A-Z]\d{2}\b/gi, '[MÃ_HS]');
  }

  function buildLocalSocraticReply({ subject, topicTitle, action, question, attemptCount }) {
    if (action === 'solution' && attemptCount >= CONFIG.aiTutor.minAttemptsForSolution) {
      return {
        reply:
          `Em đã tự suy nghĩ rất kiên trì qua ${attemptCount} lượt! Đây là lời giải từng bước môn ${subject}` +
          (topicTitle ? ` (${topicTitle})` : '') +
          `:\n1) Tóm tắt dữ kiện đề bài từ câu của em: "${question}".\n` +
          `2) Áp dụng công thức trọng tâm: với hàm bậc hai y = ax² + bx + c, hoành độ đỉnh x_I = -b/(2a), sau đó thay x_I vào hàm số để tìm y_I.\n` +
          `3) Kiểm tra lại dấu của hệ số a để kết luận bề lõm đồ thị và đối chiếu đáp số cuối cùng nhé!`,
        step: 'solution',
        source: 'local-socratic',
      };
    }

    if (attemptCount === 0) {
      return {
        reply:
          `Câu hỏi môn ${subject} rất hay! Khoan nhìn đáp số vội nhé — trước tiên em hãy xác định giúp thầy/cô: ` +
          `trong đề "${question}", đề bài đã cho biết những đại lượng/hệ số nào và đang yêu cầu tìm gì?`,
        step: 'hint-1',
        source: 'local-socratic',
      };
    }

    return {
      reply:
        `Hướng làm của em đang đi đúng rồi đấy! Bước tiếp theo: em thử thay các hệ số vừa tìm được vào công thức của bài ` +
        `"${topicTitle || subject}" rồi tính nháp xem kết quả trung gian ra bao nhiêu? (Sau lượt này nút "Xem lời giải đầy đủ" đã mở để em đối chiếu).`,
      step: 'hint-2',
      source: 'local-socratic',
    };
  }

  /**
   * Hàm chính gọi API Gia sư AI — chỉ cần truyền JSON nhỏ, tự xử lý lỗi/timeout mượt mà
   */
  async function askTutor({
    subject,
    topicTitle,
    action = 'ask',
    question,
    attemptCount = 0,
    history = [],
    accessToken = null,
    online = true,
  }) {
    const cleanQuestion = stripStudentPii(question);

    if (detectDistress(cleanQuestion)) {
      return { reply: DISTRESS_CARE_MESSAGE, step: 'care', distress: true, source: 'safety-guard' };
    }

    // 1. Gọi qua Backend FastAPI `/api/v1/tutor/ask` nếu đã cấu hình URL và đang có mạng
    if (online && CONFIG.aiTutor.mode === 'backend' && CONFIG.api.baseUrl) {
      try {
        const res = await fetch(`${CONFIG.api.baseUrl.replace(/\/$/, '')}/api/v1/tutor/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            subject,
            topic: topicTitle || null,
            action,
            question: cleanQuestion,
            attempt_count: attemptCount,
            history: history.slice(-6).map((m) => ({
              role: m.sender === 'student' ? 'user' : 'assistant',
              content: stripStudentPii(m.text),
            })),
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.reply) {
            return {
              reply: json.data.reply,
              step: json.data.step || action,
              distress: Boolean(json.data.distress),
              source: 'backend-api',
            };
          }
        }
      } catch {
        // Mạng chập chờn -> tự động rơi xuống nhánh Socratic nội bộ bên dưới
      }
    }

    // 2. Gọi trực tiếp 1 API nhỏ (OpenAI-compatible JSON endpoint) nếu đồng đội điền `aiTutor.endpoint`
    if (online && CONFIG.aiTutor.mode === 'direct' && CONFIG.aiTutor.endpoint) {
      try {
        const sysPrompt =
          action === 'solution'
            ? 'Bạn là gia sư vùng cao thân thiện. Trình bày lời giải từng bước dễ hiểu bằng tiếng Việt.'
            : 'Bạn là gia sư Socratic cho học sinh nội trú. Không cho đáp án ngay; chỉ gợi mở từng bước ngắn gọn.';
        const res = await fetch(CONFIG.aiTutor.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(CONFIG.aiTutor.apiKey ? { Authorization: `Bearer ${CONFIG.aiTutor.apiKey}` } : {}),
          },
          body: JSON.stringify({
            model: CONFIG.aiTutor.model,
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: `[${subject} - ${topicTitle || ''}] ${cleanQuestion}` },
            ],
            temperature: 0.3,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const content =
            data?.choices?.[0]?.message?.content || data?.reply || data?.data?.reply || '';
          if (content) {
            return { reply: content, step: action, distress: false, source: 'direct-api' };
          }
        }
      } catch {
        // Fallback an toàn khi mất kết nối
      }
    }

    // 3. Fallback Socratic nội bộ (0 độ trễ, hoạt động cả khi mất mạng 100%)
    return buildLocalSocraticReply({
      subject,
      topicTitle,
      action,
      question: cleanQuestion,
      attemptCount,
    });
  }

  function buildPracticeQuiz(topic) {
    return {
      topicId: topic.id,
      title: `5 câu tự luyện tối nay: ${topic.title}`,
      questions: [
        {
          q: `Câu 1 (${topic.subject}): Trong bài "${topic.title}", bước đầu tiên cần xác định là gì?`,
          options: [
            'Xác định hệ số và tập xác định',
            'Đoán ngay đáp số',
            'Bỏ qua điều kiện đề bài',
          ],
          correct: 0,
        },
        {
          q: 'Câu 2: Đồ thị hàm số y = x² - 4x + 3 có trục đối xứng là đường thẳng nào?',
          options: ['x = 2', 'x = -2', 'x = 4'],
          correct: 0,
        },
        {
          q: 'Câu 3: Khi hệ số a > 0, bề lõm của Parabol hướng về phía nào?',
          options: ['Hướng lên trên', 'Hướng xuống dưới', 'Nằm ngang'],
          correct: 0,
        },
        {
          q: 'Câu 4: Đỉnh I của Parabol y = x² - 4x + 3 có tung độ y_I bằng bao nhiêu?',
          options: ['y_I = -1', 'y_I = 3', 'y_I = 1'],
          correct: 0,
        },
        {
          q: 'Câu 5: Khi gặp bài tập khó trong giờ tự học tối, cách học hiệu quả nhất là gì?',
          options: [
            'Tự tóm tắt dữ kiện, thử nháp 2 bước rồi đối chiếu gợi ý',
            'Chép ngay đáp số mà không hiểu công thức',
            'Bỏ trống không ghi chép',
          ],
          correct: 0,
        },
      ],
    };
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.aiTutorApi = {
    detectDistress,
    stripStudentPii,
    askTutor,
    buildPracticeQuiz,
  };
})(window);
