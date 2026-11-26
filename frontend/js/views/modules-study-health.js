/**
 * BẢN NHÀ — Sổ liên lạc Bản – Trường, Gia sư buổi tối & Y tế học đường
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
    const children =
      role === 'parent'
        ? (user.childrenIds || ['stu-01']).map((id) => profilesMap[id]).filter(Boolean)
        : [];
    const targetStudentId =
      role === 'student'
        ? user.id
        : role === 'parent'
          ? state.session.selectedChildId || 'stu-01'
          : 'stu-01';
    const student =
      profilesMap[targetStudentId] || global.BanNha.store.getStudents()[0] || user;
    const studentGrades = student ? state.grades.filter((g) => g.studentId === student.id) : [];
    const gpas = studentGrades.map(calcWeightedAverage).filter((v) => v !== null);
    const avgAll = gpas.length ? (gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(1) : '—';
    const canEditGrades = role === 'teacher' || role === 'admin';

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Sổ liên lạc Bản – Trường</h1>
            <p class="text-muted">
              Học sinh <strong>${esc(student.fullName)}</strong> · Lớp ${esc(student.className || '—')}
            </p>
          </div>
          ${
            children.length > 1
              ? `<div class="row-wrap">
                  ${children
                    .map(
                      (c) => `
                    <button
                      type="button"
                      class="btn ${c.id === student.id ? 'btn-primary' : 'btn-secondary'} btn-sm"
                      data-action="select-child"
                      data-child-id="${c.id}"
                    >
                      ${esc(c.fullName)}
                    </button>`,
                    )
                    .join('')}
                </div>`
              : `<span class="chip">Điểm trung bình HK1: ${avgAll}</span>`
          }
        </div>

        <div class="grid-main-aside">
          <div class="card stack-md">
            <div class="row-between">
              <h3>Bảng điểm Học kỳ 1</h3>
              <span class="text-muted">Tính theo hệ số 1 – 2 – 3</span>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Môn học</th>
                    <th class="num-col">Miệng</th>
                    <th class="num-col">15 phút</th>
                    <th class="num-col">Giữa kỳ</th>
                    <th class="num-col">Cuối kỳ</th>
                    <th class="num-col">TB môn</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    studentGrades.length
                      ? studentGrades
                          .map((g) => {
                            const avg = calcWeightedAverage(g);
                            const chipClass =
                              avg === null
                                ? 'chip-muted'
                                : avg >= 8
                                  ? 'chip-success'
                                  : avg >= 6.5
                                    ? 'chip'
                                    : 'chip-amber';
                            return `
                              <tr>
                                <td><strong>${esc(g.subject)}</strong></td>
                                <td class="num-col">${g.oral ?? '—'}</td>
                                <td class="num-col">${g.quiz15 ?? '—'}</td>
                                <td class="num-col">${g.midterm ?? '—'}</td>
                                <td class="num-col">${g.finalExam ?? '—'}</td>
                                <td class="num-col"><span class="chip ${chipClass}">${avg !== null ? avg.toFixed(1) : '—'}</span></td>
                              </tr>`;
                          })
                          .join('')
                      : '<tr><td colspan="6" class="text-muted">Chưa có điểm môn học nào được nhập.</td></tr>'
                  }
                </tbody>
              </table>
            </div>

            ${
              canEditGrades
                ? `<form class="card-sunken stack-sm" data-form="add-grade">
                    <h4>Cập nhật nhanh điểm môn mới</h4>
                    <div class="grid-2">
                      <div class="field">
                        <label for="gr-sub">Tên môn học</label>
                        <input id="gr-sub" name="subject" class="input" placeholder="Ví dụ: Lịch sử" required />
                      </div>
                      <div class="field">
                        <label for="gr-score">Điểm cuối kỳ (0 – 10)</label>
                        <input id="gr-score" name="finalExam" type="number" step="0.5" min="0" max="10" class="input" placeholder="8.5" required />
                      </div>
                    </div>
                    <div>
                      <button type="submit" class="btn btn-primary btn-sm">Lưu điểm vào sổ</button>
                    </div>
                  </form>`
                : ''
            }
          </div>

          <div class="card stack-md">
            <div class="row-between">
              <h3>Thông báo từ Giáo viên</h3>
              <span class="chip chip-muted">${state.announcements.length} tin</span>
            </div>
            ${
              state.announcements.length
                ? state.announcements
                    .map(
                      (a) => `
                    <div class="card-sunken stack-sm">
                      <div class="row-between">
                        <strong>${esc(a.title)}</strong>
                        <span class="text-muted tabular">${esc(a.createdAt)}</span>
                      </div>
                      <p class="text-muted">${esc(a.body)}</p>
                    </div>`,
                    )
                    .join('')
                : '<p class="text-muted">Chưa có thông báo mới từ giáo viên chủ nhiệm.</p>'
            }

            ${
              canEditGrades
                ? `<form class="stack-sm" style="padding-top:0.5rem;border-top:1px solid var(--color-line)" data-form="create-announcement">
                    <h4>Gửi thông báo mới tới phụ huynh</h4>
                    <div class="field">
                      <label for="an-title">Tiêu đề</label>
                      <input id="an-title" name="title" class="input" placeholder="Ví dụ: Lịch họp phụ huynh cuối tháng..." required />
                    </div>
                    <div class="field">
                      <label for="an-body">Nội dung</label>
                      <textarea id="an-body" name="body" class="textarea" placeholder="Viết ngắn gọn, dễ hiểu cho phụ huynh..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm">Gửi thông báo</button>
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
    const quickPrompts = [
      'Tìm tọa độ đỉnh của Parabol y = x² - 4x + 3',
      'Cho biết cách xác định trục đối xứng hàm bậc hai',
      'Em tính được x_I = 2, bước tiếp theo tính y_I thế nào ạ?',
    ];
    const quizAnswers = state.ui.quizAnswers || {};

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Gia sư buổi tối</h1>
            <p class="text-muted">Hỏi bài trong giờ tự học — gợi ý từng bước để em tự hiểu và tự làm được bài.</p>
          </div>
          <div class="row-wrap">
            <span class="chip ${state.online ? 'chip-success' : 'chip-amber'}">
              ${state.online ? 'Sẵn sàng hỗ trợ' : 'Chế độ hỗ trợ ngoại tuyến'}
            </span>
            <span class="chip chip-muted tabular">Còn ${remaining}/${CONFIG.aiTutor.dailyLimit} lượt hôm nay</span>
          </div>
        </div>

        <div class="grid-main-aside">
          <div class="card stack-md">
            <div class="row-between">
              <h3>Phòng tự học · ${esc(activeTopic ? activeTopic.subject : t.subject)}</h3>
              <span class="text-muted">Thử suy nghĩ ${minTries} bước để mở lời giải</span>
            </div>

            <div class="step-meter" aria-label="Tiến độ giải bài">
              <div class="step-pill" data-active="${t.attemptCount >= 1}">1. Nêu đề & dữ kiện</div>
              <div class="step-pill" data-active="${t.attemptCount >= 2}">2. Thử bước tính</div>
              <div class="step-pill" data-active="${unlockedSolution}">3. Đối chiếu lời giải</div>
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

            <div class="stack-sm">
              <span class="field-hint">Câu hỏi gợi ý nhanh:</span>
              <div class="row-wrap">
                ${quickPrompts
                  .map(
                    (prompt) => `
                  <button
                    type="button"
                    class="prompt-chip"
                    data-action="quick-tutor-prompt"
                    data-prompt="${esc(prompt)}"
                  >
                    ${esc(prompt)}
                  </button>`,
                  )
                  .join('')}
              </div>
            </div>

            <form class="stack-sm" data-form="ask-tutor">
              <div class="field">
                <label for="tutor-input">Viết đề bài hoặc bước làm thử của em</label>
                <textarea
                  id="tutor-input"
                  name="question"
                  class="textarea"
                  placeholder="Chép đề bài hoặc cách em đang nghĩ..."
                  required
                ></textarea>
              </div>
              <div class="row-wrap">
                <button type="submit" name="mode" value="ask" class="btn btn-primary">
                  Gửi câu hỏi
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  data-action="unlock-tutor-solution"
                  ${!unlockedSolution ? 'disabled' : ''}
                >
                  ${unlockedSolution ? 'Xem lời giải đầy đủ' : `Mở lời giải sau ${minTries - t.attemptCount} lượt thử nữa`}
                </button>
              </div>
            </form>
          </div>

          <div class="stack-md">
            <div class="card stack-md">
              <h3>Bài học tuần này trên lớp</h3>
              ${
                state.lessonTopics.length
                  ? state.lessonTopics
                      .map(
                        (tp) => `
                      <div class="card-sunken stack-sm">
                        <div class="row-between">
                          <strong>${esc(tp.subject)} · ${esc(tp.title)}</strong>
                        </div>
                        <p class="text-muted">${esc(tp.summary)}</p>
                        <div>
                          <button type="button" class="btn btn-secondary btn-sm" data-action="generate-quiz" data-topic-id="${tp.id}">
                            Làm 5 câu tự luyện
                          </button>
                        </div>
                      </div>`,
                      )
                      .join('')
                  : '<p class="text-muted">Giáo viên chưa đăng chủ đề ôn tập tuần này. Em vẫn có thể nhập trực tiếp câu hỏi ở khung bên trái.</p>'
              }
            </div>

            ${
              state.ui.activePracticeQuiz
                ? `<div class="card stack-md">
                    <div class="row-between">
                      <h3>${esc(state.ui.activePracticeQuiz.title)}</h3>
                      <span class="chip">Chọn đáp án để tự kiểm tra</span>
                    </div>
                    ${state.ui.activePracticeQuiz.questions
                      .map((q, qIdx) => {
                        const chosen = quizAnswers[qIdx];
                        return `
                          <div class="card-sunken stack-sm">
                            <strong>${esc(q.q)}</strong>
                            <div class="stack-sm">
                              ${q.options
                                .map((opt, optIdx) => {
                                  let stateAttr = '';
                                  if (chosen !== undefined) {
                                    if (optIdx === q.correct) stateAttr = 'correct';
                                    else if (optIdx === chosen) stateAttr = 'wrong';
                                  }
                                  return `
                                    <button
                                      type="button"
                                      class="quiz-option"
                                      data-action="answer-quiz"
                                      data-q-index="${qIdx}"
                                      data-opt-index="${optIdx}"
                                      ${stateAttr ? `data-state="${stateAttr}"` : ''}
                                    >
                                      ${esc(opt)}
                                    </button>`;
                                })
                                .join('')}
                            </div>
                          </div>`;
                      })
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
    const user = global.BanNha.store.getCurrentUser();
    const role = state.session.activeRole;
    const checks =
      role === 'student'
        ? state.healthChecks.filter((h) => h.studentId === user.id)
        : state.healthChecks;

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Y tế học đường & Khẩn cấp SOS</h1>
            <p class="text-muted">Báo ốm tại phòng, theo dõi sức khỏe định kỳ và gọi hỗ trợ khẩn cấp khi cần.</p>
          </div>
          <span class="chip">Hồ sơ sức khỏe được bảo mật</span>
        </div>

        <section class="card card-danger stack-md">
          <div class="row-between">
            <div class="stack-sm">
              <h2 style="color:var(--color-danger)">Gọi hỗ trợ khẩn cấp (SOS)</h2>
              <p class="text-muted">Nhấn và giữ nút đỏ đủ 2 giây để báo ngay cho thầy cô Quản sinh và Phòng Y tế. Nếu không có mạng, bấm gọi điện trực tiếp.</p>
            </div>
            <div class="row-wrap">
              <a class="btn btn-secondary btn-sm" href="tel:0987410229">${icon('phone', 15)} Gọi Quản sinh</a>
              <a class="btn btn-secondary btn-sm" href="tel:0976112334">${icon('phone', 15)} Gọi Phòng Y tế</a>
            </div>
          </div>

          <button type="button" class="sos-hold-btn" data-hold-sos="2000">
            <span class="hold-fill"></span>
            <span class="hold-label">Nhấn và giữ đủ 2 giây để phát tín hiệu SOS</span>
          </button>

          ${
            state.sosAlerts.length > 0
              ? `<div class="alert alert-danger" role="alert">
                  Đã gửi ${state.sosAlerts.length} tín hiệu SOS lúc ${esc(state.sosAlerts[0].time)} — Cán bộ trực đang đến hỗ trợ ngay.
                </div>`
              : ''
          }
        </section>

        <div class="grid-aside-main">
          <form class="card stack-md" data-form="report-sick">
            <h3>Báo ốm tại phòng</h3>
            <div class="field">
              <label for="sk-sym">Triệu chứng đang gặp</label>
              <textarea id="sk-sym" name="symptoms" class="textarea" placeholder="Ví dụ: Sốt nhẹ, đau đầu, ho khan..." required></textarea>
            </div>
            <div class="field">
              <label for="sk-sev">Mức độ</label>
              <select id="sk-sev" name="severity" class="select">
                <option value="Nhẹ">Nhẹ — Tự xuống Phòng Y tế được</option>
                <option value="Cần hỗ trợ tại phòng">Mệt nhiều — Nhờ cán bộ Y tế lên phòng</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary">Gửi báo ốm</button>
          </form>

          <div class="stack-md">
            <div class="card stack-md">
              <h3>Lịch khám & Tiếp nhận y tế</h3>
              ${state.medicalReminders
                .map(
                  (m) => `
                <div class="card-sunken row-between">
                  <div>
                    <strong>${esc(m.title)}</strong>
                    <p class="text-muted tabular">Thời gian: ${esc(m.dueAt)}</p>
                  </div>
                  <span class="chip chip-amber">Sắp tới</span>
                </div>`,
                )
                .join('')}
              ${state.healthReports
                .map((hr) => {
                  const st = profilesMap[hr.studentId];
                  return `
                    <div class="card-sunken stack-sm">
                      <div class="row-between">
                        <strong>${esc(st ? st.fullName : hr.studentId)} · ${esc(hr.severity)}</strong>
                        <span class="chip">${esc(hr.status)}</span>
                      </div>
                      <p class="text-muted">${esc(hr.symptoms)}</p>
                    </div>`;
                })
                .join('')}
            </div>

            ${
              checks.length
                ? `<div class="card stack-md">
                    <h3>Theo dõi thể chất định kỳ</h3>
                    <div class="table-wrap">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>Đợt khám</th>
                            ${role !== 'student' ? '<th>Học sinh</th>' : ''}
                            <th class="num-col">Chiều cao</th>
                            <th class="num-col">Cân nặng</th>
                            <th>Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${checks
                            .map((c) => {
                              const st = profilesMap[c.studentId];
                              return `
                                <tr>
                                  <td>${esc(c.term)}</td>
                                  ${role !== 'student' ? `<td><strong>${esc(st ? st.fullName : c.studentId)}</strong></td>` : ''}
                                  <td class="num-col">${esc(c.heightCm)} cm</td>
                                  <td class="num-col">${esc(c.weightKg)} kg</td>
                                  <td class="text-muted">${esc(c.note)}</td>
                                </tr>`;
                            })
                            .join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>`
                : ''
            }
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
