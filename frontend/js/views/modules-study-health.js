/**
 * BẢN NHÀ — Phân hệ 3 (★ Sổ liên lạc), 4 (★ Gia sư AI tối) & 5 (Y tế học đường + SOS 2 giây)
 */
(function initModulesStudyHealth(global) {
  const { esc } = global.BanNha.utils;
  const { calcWeightedAverage } = global.BanNha.domain;
  const { icon } = global.BanNha.icons;
  const { CONFIG } = global.BanNha;

  function renderContactBookView(state) {
    const role = state.session.activeRole;
    const user = global.BanNha.store.getCurrentUser();
    const profilesMap = global.BanNha.store.getProfilesMap();
    const targetStudentId =
      role === 'student'
        ? user.id
        : role === 'parent'
          ? state.session.selectedChildId || 'stu-01'
          : 'stu-01';
    const student = profilesMap[targetStudentId] || global.BanNha.store.getStudents()[0];
    const studentGrades = state.grades.filter((g) => g.studentId === student.id);
    const canEditGrades = role === 'teacher' || role === 'admin';

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>★ Sổ liên lạc Bản – Trường</h1>
            <p class="text-muted">Kết nối trực tiếp kết quả học tập & thông báo của em <strong>${esc(student.fullName)}</strong> (${esc(student.className)}).</p>
          </div>
          <span class="chip chip-star">Tính điểm chuẩn hệ số 1 – 2 – 3</span>
        </div>

        <div class="grid-2 reveal-up">
          <div class="card stack-md">
            <h3>Bảng điểm Học kỳ 1 — ${esc(student.fullName)}</h3>
            <div class="table-wrap">
              <table class="data-table tabular">
                <thead>
                  <tr>
                    <th>Môn học</th>
                    <th>Miệng (×1)</th>
                    <th>15p (×1)</th>
                    <th>Giữa kỳ (×2)</th>
                    <th>Cuối kỳ (×3)</th>
                    <th>TB môn</th>
                  </tr>
                </thead>
                <tbody>
                  ${studentGrades
                    .map((g) => {
                      const avg = calcWeightedAverage(g);
                      return `
                        <tr>
                          <td><strong>${esc(g.subject)}</strong></td>
                          <td>${g.oral ?? '—'}</td>
                          <td>${g.quiz15 ?? '—'}</td>
                          <td>${g.midterm ?? '—'}</td>
                          <td>${g.finalExam ?? '—'}</td>
                          <td><span class="chip">${avg !== null ? avg.toFixed(1) : '—'}</span></td>
                        </tr>`;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>

            ${
              canEditGrades
                ? `<form class="card-sunken stack-sm" data-form="add-grade">
                    <h4>Nhập nhanh điểm môn mới cho lớp chủ nhiệm</h4>
                    <div class="grid-2">
                      <input name="subject" class="input" placeholder="Tên môn (VD: Lịch sử)" required />
                      <input name="finalExam" type="number" step="0.5" min="0" max="10" class="input" placeholder="Điểm cuối kỳ (0-10)" required />
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm">Lưu điểm & Thông báo Phụ huynh</button>
                  </form>`
                : ''
            }
          </div>

          <div class="card stack-md">
            <h3>Thông báo từ Giáo viên chủ nhiệm</h3>
            ${state.announcements
              .map(
                (a) => `
              <div class="card-sunken stack-sm">
                <div class="row-between">
                  <strong>${esc(a.title)}</strong>
                  <span class="text-muted tabular">${esc(a.createdAt)}</span>
                </div>
                <p>${esc(a.body)}</p>
              </div>`,
              )
              .join('')}

            ${
              canEditGrades
                ? `<form class="stack-sm" data-form="create-announcement">
                    <div class="field">
                      <label for="an-title">Gửi thông báo mới tới Phụ huynh ở bản</label>
                      <input id="an-title" name="title" class="input" placeholder="Tiêu đề thông báo..." required />
                    </div>
                    <textarea name="body" class="textarea" placeholder="Nội dung ngắn gọn, rõ ràng..." required></textarea>
                    <button type="submit" class="btn btn-primary btn-sm">Phát thông báo lớp</button>
                  </form>`
                : ''
            }
          </div>
        </div>
      </div>`;
  }

  function renderTutorView(state) {
    const t = state.tutorState;
    const minTries = CONFIG.aiTutor.minAttemptsForSolution;
    const unlockedSolution = t.attemptCount >= minTries;
    const remaining = Math.max(0, CONFIG.aiTutor.dailyLimit - t.usedToday);
    const activeTopic =
      state.lessonTopics.find((tp) => tp.id === t.topicId) || state.lessonTopics[0];
    const apiBadge =
      CONFIG.api.baseUrl || CONFIG.aiTutor.endpoint
        ? 'Đã nối API Gia sư AI trực tuyến'
        : 'Chế độ Socratic sẵn sàng · Cắm 1 API nhỏ tại js/config.js';

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>★ Gia sư AI buổi tối</h1>
            <p class="text-muted">Hướng dẫn gợi mở từng bước theo bài trên lớp — ẩn danh hoàn toàn thông tin cá nhân của em.</p>
          </div>
          <div class="row-wrap">
            <span class="chip chip-star">${esc(apiBadge)}</span>
            <span class="chip tabular">Còn ${remaining}/${CONFIG.aiTutor.dailyLimit} câu hôm nay</span>
          </div>
        </div>

        <div class="grid-2 reveal-up">
          <div class="card stack-md">
            <div class="row-between">
              <h3>Phòng tự học: ${esc(activeTopic.subject)}</h3>
              <span class="chip">${unlockedSolution ? 'Đã mở khóa lời giải' : `Tự thử ${t.attemptCount}/${minTries} lượt để mở lời giải`}</span>
            </div>

            <div class="chat-log" id="tutor-chat-log">
              ${t.messages
                .map(
                  (m) => `
                <div class="chat-bubble" data-sender="${m.sender}">
                  <p style="white-space:pre-line">${esc(m.text)}</p>
                </div>`,
                )
                .join('')}
            </div>

            <form class="stack-sm" data-form="ask-tutor">
              <div class="field">
                <label for="tutor-input">Đề bài hoặc bước làm thử của em</label>
                <textarea
                  id="tutor-input"
                  name="question"
                  class="textarea"
                  placeholder="Ví dụ: Tìm tọa độ đỉnh của Parabol y = x^2 - 4x + 3..."
                  required
                ></textarea>
              </div>
              <div class="row-wrap">
                <button type="submit" name="mode" value="ask" class="btn btn-primary">
                  Gửi câu hỏi / Bước làm thử
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  data-action="unlock-tutor-solution"
                  ${!unlockedSolution ? 'disabled' : ''}
                >
                  ${unlockedSolution ? 'Xem lời giải đầy đủ' : `Xem lời giải (cần thử thêm ${minTries - t.attemptCount} lượt)`}
                </button>
              </div>
            </form>
          </div>

          <div class="stack-md">
            <div class="card stack-md">
              <h3>Chủ đề thầy cô đang dạy tuần này</h3>
              ${state.lessonTopics
                .map(
                  (tp) => `
                <div class="card-sunken stack-sm">
                  <div class="row-between">
                    <strong>${esc(tp.subject)} · ${esc(tp.title)}</strong>
                    <button type="button" class="btn btn-secondary btn-sm" data-action="generate-quiz" data-topic-id="${tp.id}">
                      Tạo 5 câu ôn tập
                    </button>
                  </div>
                  <p class="text-muted">${esc(tp.summary)}</p>
                </div>`,
                )
                .join('')}
            </div>

            ${
              state.ui.activePracticeQuiz
                ? `<div class="card card-star stack-sm reveal-up">
                    <h3>${esc(state.ui.activePracticeQuiz.title)}</h3>
                    ${state.ui.activePracticeQuiz.questions
                      .map(
                        (q) => `
                      <div class="card-sunken stack-sm">
                        <strong>${esc(q.q)}</strong>
                        <p class="text-muted">Đáp án gợi ý: <strong>${esc(q.options[q.correct])}</strong></p>
                      </div>`,
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
        </div>
      </div>`;
  }

  function renderHealthView(state) {
    const profilesMap = global.BanNha.store.getProfilesMap();
    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Y tế học đường & Khẩn cấp SOS</h1>
            <p class="text-muted">Báo ốm tại phòng, theo dõi thể chất định kỳ & gọi cứu trợ khẩn cấp ban đêm.</p>
          </div>
          <span class="chip">Bảo mật hồ sơ sức khỏe học sinh</span>
        </div>

        <div class="card stack-md reveal-up" style="border-color:rgba(198,40,40,0.35)">
          <div class="row-between">
            <div class="stack-sm">
              <h2 style="color:var(--color-danger)">Tín hiệu khẩn cấp SOS (Nhấn và giữ đủ 2 giây)</h2>
              <p class="text-muted">Chống bấm nhầm khi để điện thoại trong túi áo. Nếu mất mạng hoàn toàn, hãy bấm nút gọi điện trực tiếp bên dưới.</p>
            </div>
            <div class="row-wrap">
              <a class="btn btn-secondary btn-sm" href="tel:0987410229">${icon('phone', 16)} Gọi Quản sinh (0987.410.229)</a>
              <a class="btn btn-secondary btn-sm" href="tel:0976112334">${icon('phone', 16)} Gọi Phòng Y tế (0976.112.334)</a>
            </div>
          </div>

          <button type="button" class="sos-hold-btn" data-hold-sos="2000">
            <span class="hold-fill"></span>
            <span class="hold-label">Nhấn giữ 2 giây để phát tín hiệu SOS tới Quản sinh & Y tế</span>
          </button>

          ${
            state.sosAlerts.length > 0
              ? `<div class="alert alert-danger" role="alert">
                  Đã ghi nhận ${state.sosAlerts.length} tín hiệu SOS lúc ${esc(state.sosAlerts[0].time)} — Thầy cô trực đang tới phòng hỗ trợ ngay!
                </div>`
              : ''
          }
        </div>

        <div class="grid-2 reveal-up" style="--stagger:1">
          <form class="card stack-md" data-form="report-sick">
            <h3>Báo ốm / Xin cấp thuốc tại phòng</h3>
            <div class="field">
              <label for="sk-sym">Triệu chứng em đang gặp</label>
              <textarea id="sk-sym" name="symptoms" class="textarea" placeholder="Ví dụ: Em bị sốt nhẹ, đau đầu sau giờ thể dục chiều..." required></textarea>
            </div>
            <div class="field">
              <label for="sk-sev">Mức độ</label>
              <select id="sk-sev" name="severity" class="select">
                <option value="Nhẹ">Nhẹ — Còn tự đi xuống Phòng Y tế được</option>
                <option value="Cần hỗ trợ tại phòng">Mệt nhiều — Nhờ cán bộ Y tế lên phòng kiểm tra</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">Gửi báo ốm tới Phòng Y tế</button>
          </form>

          <div class="card stack-md">
            <h3>Hồ sơ khám định kỳ & Lịch nhắc y tế</h3>
            ${state.medicalReminders
              .map(
                (m) => `
              <div class="card-sunken row-between">
                <div>
                  <strong>${esc(m.title)}</strong>
                  <p class="text-muted tabular">Hẹn lúc: ${esc(m.dueAt)}</p>
                </div>
                <span class="chip chip-star">Sắp tới</span>
              </div>`,
              )
              .join('')}
            ${state.healthReports
              .map((hr) => {
                const st = profilesMap[hr.studentId];
                return `
                  <div class="card-sunken stack-sm">
                    <div class="row-between">
                      <strong>${esc(st ? st.fullName : hr.studentId)} · Mức: ${esc(hr.severity)}</strong>
                      <span class="chip">${esc(hr.status)}</span>
                    </div>
                    <p class="text-muted">${esc(hr.symptoms)}</p>
                  </div>`;
              })
              .join('')}
          </div>
        </div>
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.modulesStudyHealth = {
    renderContactBookView,
    renderTutorView,
    renderHealthView,
  };
})(window);
