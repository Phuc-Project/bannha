/**
 * BẢN NHÀ — Ngân hàng đồ cũ, Học bổng & Hướng nghiệp, Kho văn hóa & Quản trị trường
 */
(function initModulesCommunityAdmin(global) {
  const { esc } = global.BanNha.utils;
  const { ROLE_LABELS } = global.BanNha.domain;

  const CAT_LABELS = {
    winter_coat: 'Áo ấm mùa đông',
    uniform: 'Đồng phục trường',
    textbook: 'Sách giáo khoa & Dụng cụ học tập',
  };

  const RIASEC_QUESTIONS = [
    {
      code: 'R',
      label: 'Thực tế – Kỹ thuật',
      desc: 'Thích sửa chữa đồ điện, máy móc, trồng trọt, làm việc thực hành ngoài trời.',
      defaultVal: 18,
    },
    {
      code: 'I',
      label: 'Nghiên cứu – Khoa học',
      desc: 'Thích tìm hiểu nguyên lý Toán – Lý – Hóa – Sinh, chăm sóc sức khỏe, công nghệ.',
      defaultVal: 20,
    },
    {
      code: 'A',
      label: 'Nghệ thuật – Sáng tạo',
      desc: 'Thích vẽ, thêu dệt thổ cẩm, âm nhạc, chụp ảnh hoặc viết câu chuyện sáng tạo.',
      defaultVal: 14,
    },
    {
      code: 'S',
      label: 'Xã hội – Cộng đồng',
      desc: 'Thích giảng bài cho bạn, lắng nghe, chăm sóc người khác và tham gia việc chung.',
      defaultVal: 22,
    },
    {
      code: 'E',
      label: 'Quản lý – Kinh doanh',
      desc: 'Thích tổ chức hoạt động nhóm, giới thiệu sản vật quê hương hoặc làm du lịch bản.',
      defaultVal: 16,
    },
    {
      code: 'C',
      label: 'Tổ chức – Hành chính',
      desc: 'Thích sắp xếp ngăn nắp, ghi chép sổ sách chính xác, làm việc theo kế hoạch rõ ràng.',
      defaultVal: 15,
    },
  ];

  function renderDonationsView(state) {
    const role = state.session.activeRole;
    const user = global.BanNha.store.getCurrentUser();
    const canMatch = role === 'dorm_staff' || role === 'admin' || role === 'teacher';
    const suggestions = global.BanNha.store.getDonationSuggestions();
    const availableCount = state.donations.filter((d) => d.status === 'available').length;

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Ngân hàng đồ cũ nội trú</h1>
            <p class="text-muted">Chia sẻ sách giáo khoa, đồng phục và áo ấm mùa đông — ẩn danh người tặng, giữ kín cho người nhận.</p>
          </div>
          <span class="chip">Ưu tiên áo ấm mùa đông</span>
        </div>

        <div class="grid-2">
          <div class="card stack-md">
            <div class="row-between">
              <h3>Đồ đang sẵn sàng trao tặng</h3>
              <span class="chip chip-muted">${availableCount} món sẵn sàng</span>
            </div>
            ${
              state.donations.length
                ? state.donations
                    .map(
                      (d) => `
                    <div class="card-sunken stack-sm">
                      <div class="row-between">
                        <strong>${esc(d.title)}</strong>
                        <span class="chip ${d.status === 'available' ? 'chip-success' : 'chip-muted'}">
                          ${d.status === 'available' ? esc(d.sizeOrGrade) : 'Đã trao tận tay'}
                        </span>
                      </div>
                      <p class="text-muted">${esc(CAT_LABELS[d.category] || d.category)} · Người tặng ẩn danh</p>
                    </div>`,
                    )
                    .join('')
                : '<p class="text-muted">Hiện chưa có vật phẩm nào trên kệ. Em có thể đóng góp bằng biểu mẫu bên dưới.</p>'
            }

            <form class="stack-sm" style="padding-top:0.5rem;border-top:1px solid var(--color-line)" data-form="create-donation">
              <h4>Đóng góp sách vở hoặc áo ấm</h4>
              <div class="grid-2">
                <select name="category" class="select" aria-label="Loại vật phẩm">
                  <option value="winter_coat">Áo ấm mùa đông</option>
                  <option value="textbook">Sách giáo khoa</option>
                  <option value="uniform">Đồng phục</option>
                </select>
                <input name="sizeOrGrade" class="input" placeholder="Cỡ / Khối lớp (VD: Size L, Khối 11)" required />
              </div>
              <input name="title" class="input" placeholder="Tên món đồ và tình trạng hiện tại..." required />
              <button type="submit" class="btn btn-primary btn-sm">Đăng tặng</button>
            </form>
          </div>

          <div class="card stack-md">
            ${
              canMatch
                ? `<div class="row-between">
                    <h3>Đề xuất ghép đồ phù hợp</h3>
                    <span class="chip">${suggestions.length} đề xuất</span>
                  </div>
                  <p class="text-muted">Ưu tiên học sinh đang cần gấp và đúng cỡ áo, khối lớp.</p>
                  ${
                    suggestions
                      .map(
                        (s) => `
                    <div class="card-sunken stack-sm">
                      <div class="row-between">
                        <strong>${esc(s.itemTitle)}</strong>
                        <span class="chip chip-success">${s.score >= 85 ? 'Rất phù hợp' : 'Phù hợp'}</span>
                      </div>
                      <p>Người nhận: <strong>${esc(s.recipientName)}</strong> (Phòng ${esc(s.recipientRoom)})</p>
                      <p class="text-muted">${esc(s.reason)}</p>
                      <div>
                        <button
                          type="button"
                          class="btn btn-primary btn-sm"
                          data-action="confirm-donation-match"
                          data-offer-id="${s.offerId}"
                          data-req-id="${s.requestId}"
                        >
                          Xác nhận đã trao tận tay
                        </button>
                      </div>
                    </div>`,
                      )
                      .join('') ||
                    '<p class="text-muted">Các nhu cầu hiện tại đều đã được ghép xong.</p>'
                  }`
                : `<h3>Đăng ký nhận hỗ trợ kín đáo</h3>
                  <div class="alert alert-info">
                    Thông tin đăng ký của em <strong>chỉ mình em và thầy cô Quản sinh</strong> nhìn thấy, hoàn toàn không hiển thị công khai.
                  </div>
                  <form class="stack-sm" data-form="create-item-request">
                    <div class="field">
                      <label for="req-cat">Vật phẩm em đang cần</label>
                      <select id="req-cat" name="category" class="select">
                        <option value="winter_coat">Áo ấm mùa đông</option>
                        <option value="textbook">Sách giáo khoa / Vở viết</option>
                        <option value="uniform">Đồng phục trường</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="req-size">Cỡ áo hoặc khối lớp</label>
                      <input id="req-size" name="sizeOrGrade" class="input" placeholder="Ví dụ: Size M, Khối 10" required />
                    </div>
                    <div class="field">
                      <label for="req-note">Ghi chú thêm</label>
                      <textarea id="req-note" name="note" class="textarea" placeholder="Ghi thêm thông tin nếu cần..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-sm">Gửi đăng ký kín đáo</button>
                  </form>
                  <div class="stack-sm">
                    <h4>Đơn riêng của em</h4>
                    ${
                      state.itemRequests
                        .filter((r) => r.studentId === user.id)
                        .map(
                          (r) =>
                            `<div class="card-sunken row-between"><span>${esc(CAT_LABELS[r.category])} (${esc(r.sizeOrGrade)})</span><span class="chip ${r.status === 'fulfilled' ? 'chip-success' : 'chip-amber'}">${r.status === 'fulfilled' ? 'Đã nhận đồ' : 'Đang chờ ghép'}</span></div>`,
                        )
                        .join('') || '<p class="text-muted">Em chưa gửi đăng ký nào.</p>'
                    }
                  </div>`
            }
          </div>
        </div>
      </div>`;
  }

  function renderScholarshipsView(state) {
    const tab = state.ui.activeTabs.scholarships || 'list';

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Học bổng & Hướng nghiệp</h1>
            <p class="text-muted">Cập nhật học bổng, chính sách cử tuyển và khám phá nhóm ngành nghề phù hợp với bản thân.</p>
          </div>
          <div class="tabs-bar" role="tablist">
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'list'}" data-action="switch-tab" data-module="scholarships" data-tab="list">Học bổng & Cử tuyển</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'riasec'}" data-action="switch-tab" data-module="scholarships" data-tab="riasec">Khám phá nghề nghiệp</button>
          </div>
        </div>

        ${
          tab === 'list'
            ? `<div class="grid-main-aside">
                <div class="stack-md">
                  <h2>Học bổng đang mở hồ sơ</h2>
                  ${
                    state.scholarships.length
                      ? state.scholarships
                          .map((sc) => {
                            const saved = state.savedScholarshipIds.includes(sc.id);
                            return `
                              <article class="card stack-sm">
                                <div class="row-between">
                                  <h3>${esc(sc.title)}</h3>
                                  <span class="chip chip-amber tabular">Hạn: ${esc(sc.deadline)}</span>
                                </div>
                                <p><strong>Mức hỗ trợ:</strong> ${esc(sc.amount)}</p>
                                <p class="text-muted">${esc(sc.criteria)}</p>
                                <div style="padding-top:0.35rem">
                                  <button type="button" class="btn ${saved ? 'btn-secondary' : 'btn-primary'} btn-sm" data-action="toggle-save-scholarship" data-id="${sc.id}">
                                    ${saved ? 'Đang bật nhắc hạn nộp hồ sơ' : 'Lưu & Nhắc hạn nộp hồ sơ'}
                                  </button>
                                </div>
                              </article>`;
                          })
                          .join('')
                      : '<div class="card"><p class="text-muted">Chưa có đợt học bổng nào đang mở.</p></div>'
                  }
                </div>

                <div class="stack-md">
                  <h2>Cẩm nang chính sách cử tuyển</h2>
                  ${
                    state.policyArticles.length
                      ? state.policyArticles
                          .map(
                            (pa) => `
                          <article class="card stack-sm">
                            <h3>${esc(pa.title)}</h3>
                            <p class="text-muted">${esc(pa.summary)}</p>
                          </article>`,
                          )
                          .join('')
                      : '<div class="card"><p class="text-muted">Nhà trường sẽ sớm cập nhật tài liệu hướng dẫn cử tuyển.</p></div>'
                  }
                </div>
              </div>`
            : `<div class="grid-main-aside">
                <form class="card stack-md" data-form="submit-riasec">
                  <div class="stack-sm">
                    <h3>Khảo sát sở thích nghề nghiệp</h3>
                    <p class="text-muted">Kéo thanh chọn mức độ yêu thích của em với từng nhóm hoạt động dưới đây (từ thấp đến cao).</p>
                  </div>
                  <div class="stack-md">
                    ${RIASEC_QUESTIONS.map(
                      (q) => `
                      <div class="card-sunken stack-sm">
                        <div class="row-between">
                          <label for="riasec-${q.code}"><strong>${esc(q.label)}</strong></label>
                          <span class="chip tabular" data-range-value="${q.code}">${q.defaultVal}/25</span>
                        </div>
                        <p class="text-muted">${esc(q.desc)}</p>
                        <input
                          id="riasec-${q.code}"
                          name="${q.code}"
                          type="range"
                          min="0"
                          max="25"
                          value="${q.defaultVal}"
                          class="range-input"
                          data-range-output="${q.code}"
                        />
                      </div>`,
                    ).join('')}
                  </div>
                  <button type="submit" class="btn btn-primary">Xem nhóm ngành phù hợp</button>
                </form>

                <div class="card stack-md">
                  <h3>Kết quả gợi ý hướng nghiệp</h3>
                  ${
                    state.careerResult
                      ? `<div class="card-highlight card stack-sm">
                           <span class="chip" style="align-self:flex-start">Tổ hợp nổi trội: ${esc(state.careerResult.codePair)}</span>
                           <p><strong>Nhóm 1 — ${esc(state.careerResult.primary.name)}:</strong> ${esc(state.careerResult.primary.fit)}</p>
                           <p><strong>Nhóm 2 — ${esc(state.careerResult.secondary.name)}:</strong> ${esc(state.careerResult.secondary.fit)}</p>
                         </div>
                         <div class="stack-sm">
                           <h4>Mức độ phù hợp theo 6 nhóm</h4>
                           ${state.careerResult.breakdown
                             .map((item) => {
                               const pct = Math.min(100, Math.round((item.score / 25) * 100));
                               return `
                                 <div class="stack-sm">
                                   <div class="row-between">
                                     <span class="text-muted">${esc(item.name)}</span>
                                     <strong class="tabular">${item.score}/25</strong>
                                   </div>
                                   <div class="progress-track">
                                     <div class="progress-fill" style="width:${pct}%"></div>
                                   </div>
                                 </div>`;
                             })
                             .join('')}
                         </div>`
                      : `<p class="text-muted">Sau khi kéo chọn mức độ yêu thích ở cột bên trái, bấm nút <strong>Xem nhóm ngành phù hợp</strong> để nhận gợi ý ngành học và chính sách cử tuyển tương ứng.</p>`
                  }
                </div>
              </div>`
        }
      </div>`;
  }

  function renderCultureView(state) {
    const canApprove =
      state.session.activeRole === 'teacher' || state.session.activeRole === 'admin';
    const profilesMap = global.BanNha.store.getProfilesMap();
    const visiblePosts = canApprove
      ? state.culturePosts
      : state.culturePosts.filter((p) => p.approved);

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Kho văn hóa Bản tôi</h1>
            <p class="text-muted">Nơi học sinh kể câu chuyện về trang phục, món ăn, lễ hội và phong tục đẹp của dân tộc mình.</p>
          </div>
          <span class="chip">Bài viết được thầy cô duyệt trước khi đăng</span>
        </div>

        <div class="grid-main-aside">
          <div class="stack-md">
            ${
              visiblePosts.length
                ? visiblePosts
                    .map((p) => {
                      const author = profilesMap[p.authorId];
                      return `
                        <article class="card stack-sm">
                          <div class="row-between">
                            <span class="chip">${esc(p.ethnicity)} · ${esc(p.category)}</span>
                            <span class="chip ${p.approved ? 'chip-success' : 'chip-amber'}">
                              ${p.approved ? 'Đã đăng bảng tin' : 'Chờ thầy cô duyệt'}
                            </span>
                          </div>
                          <h3>${esc(p.title)}</h3>
                          <p style="line-height:1.65">${esc(p.story)}</p>
                          <p class="text-muted">Người kể: ${esc(author ? author.fullName : 'Học sinh nội trú')}</p>
                          ${
                            canApprove && !p.approved
                              ? `<div style="padding-top:0.3rem"><button type="button" class="btn btn-primary btn-sm" data-action="approve-culture" data-id="${p.id}">Duyệt đăng bài viết</button></div>`
                              : ''
                          }
                        </article>`;
                    })
                    .join('')
                : '<p class="text-muted">Chưa có bài viết nào được đăng.</p>'
            }
          </div>

          <form class="card stack-md" data-form="create-culture-post">
            <h3>Chia sẻ câu chuyện bản làng</h3>
            <div class="grid-2">
              <div class="field">
                <label for="cu-eth">Dân tộc</label>
                <input id="cu-eth" name="ethnicity" class="input" value="Mông" required />
              </div>
              <div class="field">
                <label for="cu-cat">Chủ đề</label>
                <select id="cu-cat" name="category" class="select">
                  <option value="Trang phục & Hoa văn">Trang phục & Hoa văn</option>
                  <option value="Ẩm thực bản làng">Ẩm thực bản làng</option>
                  <option value="Lễ hội truyền thống">Lễ hội truyền thống</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label for="cu-title">Tiêu đề bài viết</label>
              <input id="cu-title" name="title" class="input" placeholder="Ví dụ: Tiếng khèn gọi bạn mùa xuân..." required />
            </div>
            <div class="field">
              <label for="cu-story">Câu chuyện của em</label>
              <textarea id="cu-story" name="story" class="textarea" placeholder="Kể lại nét đẹp văn hóa của gia đình và bản làng em..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Gửi bài chờ duyệt</button>
          </form>
        </div>
      </div>`;
  }

  function renderAdminView(state) {
    const tab = state.ui.activeTabs.admin || 'accounts';
    const students = global.BanNha.store.getStudents();
    const sampleCsv =
      'HS10A08,Trần Văn Hùng,student,10A1,A203,Tày\nHS11B09,Lý Thị Thảo,student,11B1,B105,Dao';

    return `
      <div class="stack-lg">
        <div class="page-head no-print">
          <div class="stack-sm">
            <h1>Quản trị nhà trường</h1>
            <p class="text-muted">Tạo tài khoản đầu năm học từ danh sách CSV và in thẻ QR nội trú khổ giấy A4.</p>
          </div>
          <div class="tabs-bar" role="tablist">
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'accounts'}" data-action="switch-tab" data-module="admin" data-tab="accounts">Danh bạ & Nhập CSV</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'qr-print'}" data-action="switch-tab" data-module="admin" data-tab="qr-print">In thẻ QR (A4)</button>
          </div>
        </div>

        ${
          tab === 'accounts'
            ? `<div class="grid-aside-main">
                <form class="card stack-md" data-form="csv-import">
                  <h3>Nhập danh sách tài khoản mới</h3>
                  <p class="text-muted">Mỗi dòng gồm: Mã, Họ tên, Vai trò, Lớp, Phòng, Dân tộc.</p>
                  <textarea name="csvText" class="textarea" aria-label="Dữ liệu CSV">${esc(sampleCsv)}</textarea>
                  <div class="row-wrap">
                    <button type="submit" name="mode" value="dry-run" class="btn btn-secondary">Kiểm tra danh sách</button>
                    <button type="submit" name="mode" value="commit" class="btn btn-primary">Tạo tài khoản</button>
                  </div>
                  ${
                    state.ui.csvPreview
                      ? `<div class="alert alert-info">
                          Kết quả kiểm tra: <strong>${state.ui.csvPreview.validCount} dòng hợp lệ</strong>, ${state.ui.csvPreview.errorCount} dòng cần sửa.
                        </div>`
                      : ''
                  }
                </form>

                <div class="card stack-md">
                  <div class="row-between">
                    <h3>Danh bạ tài khoản toàn trường</h3>
                    <span class="chip chip-muted">${state.profiles.length} tài khoản</span>
                  </div>
                  <div class="table-wrap">
                    <table class="data-table">
                      <thead><tr><th>Mã</th><th>Họ và tên</th><th>Vai trò</th><th>Lớp / Phòng</th></tr></thead>
                      <tbody>
                        ${state.profiles
                          .map(
                            (p) => `
                          <tr>
                            <td><span class="code-pill">${esc(p.code)}</span></td>
                            <td><strong>${esc(p.fullName)}</strong></td>
                            <td>${esc(p.roles.map((r) => ROLE_LABELS[r] || r).join(', '))}</td>
                            <td>${esc(p.className || '—')}${p.room ? ` · P.${esc(p.room)}` : ''}</td>
                          </tr>`,
                          )
                          .join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>`
            : `<div class="stack-md">
                <div class="row-between no-print">
                  <p class="text-muted">Dàn sẵn 2 cột chuẩn khổ giấy A4 (8 thẻ/trang), dùng điểm danh được ngay cả khi không có sóng.</p>
                  <button type="button" class="btn btn-primary" data-action="print-a4">In trang A4</button>
                </div>
                <div class="qr-sheet-grid">
                  ${students
                    .slice(0, 8)
                    .map(
                      (s) => `
                    <div class="card qr-print-card row-between" style="align-items:center">
                      <div class="stack-sm">
                        <span class="chip">Thẻ nội trú BẢN NHÀ</span>
                        <h3>${esc(s.fullName)}</h3>
                        <p class="text-muted">Mã: <strong>${esc(s.code)}</strong> · Lớp ${esc(s.className)}</p>
                        <p class="text-muted">Phòng KTX: <strong>${esc(s.room)}</strong></p>
                      </div>
                      <div class="qr-box" style="width:6rem;height:6rem" data-qr="${esc(s.qrToken)}"></div>
                    </div>`,
                    )
                    .join('')}
                </div>
              </div>`
        }
      </div>`;
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.modulesCommunityAdmin = {
    renderDonationsView,
    renderScholarshipsView,
    renderCultureView,
    renderAdminView,
  };
})(window);
