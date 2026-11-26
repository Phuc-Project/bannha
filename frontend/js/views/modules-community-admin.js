/**
 * BẢN NHÀ — Phân hệ 6 (Ngân hàng đồ cũ), 7 (Học bổng & RIASEC), 8 (★ Kho văn hóa) & Quản trị Admin
 */
(function initModulesCommunityAdmin(global) {
  const { esc } = global.BanNha.utils;

  const CAT_LABELS = {
    winter_coat: 'Áo ấm mùa đông',
    uniform: 'Đồng phục trường',
    textbook: 'Sách giáo khoa & Dụng cụ học tập',
  };

  function renderDonationsView(state) {
    const role = state.session.activeRole;
    const user = global.BanNha.store.getCurrentUser();
    const canMatch = role === 'dorm_staff' || role === 'admin' || role === 'teacher';
    const suggestions = global.BanNha.store.getDonationSuggestions();

    return `
      <div class="stack-lg">
        <div class="page-head">
          <div class="stack-sm">
            <h1>Ngân hàng đồ cũ nội trú</h1>
            <p class="text-muted">Luân chuyển sách giáo khoa, đồng phục, áo ấm — ẩn danh người tặng, giữ kín thể diện cho người nhận.</p>
          </div>
          <span class="chip">Ưu tiên áo ấm mùa đông (+20đ)</span>
        </div>

        <div class="grid-2 reveal-up">
          <div class="card stack-md">
            <h3>Kệ đồ đang sẵn sàng trao tặng (${state.donations.filter((d) => d.status === 'available').length})</h3>
            ${state.donations
              .map(
                (d) => `
              <div class="card-sunken stack-sm">
                <div class="row-between">
                  <strong>${esc(d.title)}</strong>
                  <span class="chip">${d.status === 'available' ? esc(d.sizeOrGrade) : 'Đã trao tận tay'}</span>
                </div>
                <p class="text-muted">${esc(CAT_LABELS[d.category] || d.category)} · Người tặng ẩn danh</p>
              </div>`,
              )
              .join('')}

            <form class="stack-sm" data-form="create-donation">
              <h4>Đóng góp thêm sách vở / áo ấm</h4>
              <div class="grid-2">
                <select name="category" class="select">
                  <option value="winter_coat">Áo ấm mùa đông</option>
                  <option value="textbook">Sách giáo khoa</option>
                  <option value="uniform">Đồng phục</option>
                </select>
                <input name="sizeOrGrade" class="input" placeholder="Cỡ / Khối lớp (VD: Size L, Khối 11)" required />
              </div>
              <input name="title" class="input" placeholder="Tên món đồ và tình trạng..." required />
              <button type="submit" class="btn btn-primary btn-sm">Đăng tặng vào Ngân hàng đồ cũ</button>
            </form>
          </div>

          <div class="card stack-md">
            ${
              canMatch
                ? `<h3>Gợi ý ghép cặp tự động cho Quản sinh (${suggestions.length})</h3>
                  <p class="text-muted">Hệ thống tự chấm điểm khớp loại đồ, cỡ/khối, mùa đông và mức cần gấp:</p>
                  ${
                    suggestions
                      .map(
                        (s) => `
                    <div class="card-sunken stack-sm">
                      <div class="row-between">
                        <strong>${esc(s.itemTitle)} → ${esc(s.recipientName)} (P.${esc(s.recipientRoom)})</strong>
                        <span class="chip chip-star">${s.score} điểm khớp</span>
                      </div>
                      <p class="text-muted">${esc(s.reason)}</p>
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        data-action="confirm-donation-match"
                        data-offer-id="${s.offerId}"
                        data-req-id="${s.requestId}"
                      >
                        Đã trao đồ tận tay học sinh
                      </button>
                    </div>`,
                      )
                      .join('') ||
                    '<p class="text-muted">Tất cả nhu cầu hiện tại đã được ghép cặp hoàn tất.</p>'
                  }`
                : `<h3>Đăng ký nhận hỗ trợ kín đáo</h3>
                  <p class="text-muted">Đơn đăng ký của em <strong>chỉ mình em và thầy/cô Quản sinh</strong> nhìn thấy, hoàn toàn không công khai trước lớp.</p>
                  <form class="stack-sm" data-form="create-item-request">
                    <select name="category" class="select">
                      <option value="winter_coat">Áo ấm mùa đông</option>
                      <option value="textbook">Sách giáo khoa / Vở viết</option>
                      <option value="uniform">Đồng phục trường</option>
                    </select>
                    <input name="sizeOrGrade" class="input" placeholder="Cỡ áo hoặc khối lớp (VD: Size M)" required />
                    <textarea name="note" class="textarea" placeholder="Ghi chú thêm cho thầy cô Quản sinh..." required></textarea>
                    <button type="submit" class="btn btn-primary btn-sm">Gửi đăng ký kín đáo</button>
                  </form>
                  <div class="stack-sm">
                    <h4>Đơn riêng của em</h4>
                    ${state.itemRequests
                      .filter((r) => r.studentId === user.id)
                      .map(
                        (r) =>
                          `<div class="card-sunken row-between"><span>${esc(CAT_LABELS[r.category])} (${esc(r.sizeOrGrade)})</span><span class="chip">${r.status === 'fulfilled' ? 'Đã nhận đồ' : 'Đang chờ ghép'}</span></div>`,
                      )
                      .join('')}
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
            <h1>Học bổng & Hướng nghiệp vùng cao</h1>
            <p class="text-muted">Chính sách Cử tuyển, học bổng DTTS và trắc nghiệm nghề nghiệp Holland (RIASEC).</p>
          </div>
          <div class="tabs-bar" role="tablist">
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'list'}" data-action="switch-tab" data-module="scholarships" data-tab="list">Học bổng & Cử tuyển</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'riasec'}" data-action="switch-tab" data-module="scholarships" data-tab="riasec">Trắc nghiệm nghề RIASEC</button>
          </div>
        </div>

        ${
          tab === 'list'
            ? `<div class="grid-2 reveal-up">
                <div class="stack-md">
                  <h2>Học bổng đang mở hồ sơ</h2>
                  ${state.scholarships
                    .map((sc) => {
                      const saved = state.savedScholarshipIds.includes(sc.id);
                      return `
                        <div class="card stack-sm">
                          <div class="row-between">
                            <h3>${esc(sc.title)}</h3>
                            <span class="chip tabular">Hạn: ${esc(sc.deadline)}</span>
                          </div>
                          <p><strong>Mức hỗ trợ:</strong> ${esc(sc.amount)}</p>
                          <p class="text-muted">${esc(sc.criteria)}</p>
                          <div>
                            <button type="button" class="btn ${saved ? 'btn-secondary' : 'btn-primary'} btn-sm" data-action="toggle-save-scholarship" data-id="${sc.id}">
                              ${saved ? 'Đã lưu nhắc hạn 7 ngày & 1 ngày' : 'Lưu học bổng & Nhắc hạn'}
                            </button>
                          </div>
                        </div>`;
                    })
                    .join('')}
                </div>
                <div class="stack-md">
                  <h2>Cẩm nang chính sách Cử tuyển</h2>
                  ${state.policyArticles
                    .map(
                      (pa) => `
                    <div class="card stack-sm">
                      <h3>${esc(pa.title)}</h3>
                      <p class="text-muted">${esc(pa.summary)}</p>
                    </div>`,
                    )
                    .join('')}
                </div>
              </div>`
            : `<div class="grid-2 reveal-up">
                <form class="card stack-md" data-form="submit-riasec">
                  <h3>Tự đánh giá sở thích nghề nghiệp (30 tiêu chí quy đổi 6 nhóm RIASEC)</h3>
                  <p class="text-muted">Chọn mức độ yêu thích từ 1 đến 25 điểm cho từng nhóm hoạt động:</p>
                  <div class="grid-2">
                    <div class="field"><label>Thực tế – Kỹ thuật (R)</label><input name="R" type="number" min="0" max="25" value="19" class="input" /></div>
                    <div class="field"><label>Nghiên cứu – Y Dược (I)</label><input name="I" type="number" min="0" max="25" value="21" class="input" /></div>
                    <div class="field"><label>Nghệ thuật – Thổ cẩm (A)</label><input name="A" type="number" min="0" max="25" value="14" class="input" /></div>
                    <div class="field"><label>Xã hội – Sư phạm (S)</label><input name="S" type="number" min="0" max="25" value="24" class="input" /></div>
                    <div class="field"><label>Quản lý – Du lịch bản (E)</label><input name="E" type="number" min="0" max="25" value="16" class="input" /></div>
                    <div class="field"><label>Nghiệp vụ – Hành chính (C)</label><input name="C" type="number" min="0" max="25" value="15" class="input" /></div>
                  </div>
                  <button type="submit" class="btn btn-primary">Xem kết quả định hướng nghề nghiệp</button>
                </form>

                <div class="card card-star stack-md">
                  <h3>Kết quả tổ hợp Holland của em</h3>
                  ${
                    state.careerResult
                      ? `<span class="chip chip-star">Mã nổi trội: ${esc(state.careerResult.codePair)}</span>
                         <p><strong>Nhóm 1 (${esc(state.careerResult.primary.name)}):</strong> ${esc(state.careerResult.primary.fit)}</p>
                         <p><strong>Nhóm 2 (${esc(state.careerResult.secondary.name)}):</strong> ${esc(state.careerResult.secondary.fit)}</p>`
                      : `<p class="text-muted">Em hãy bấm nút bên trái để hệ thống phân tích 2 nhóm ngành phù hợp nhất với thế mạnh của mình và chính sách Cử tuyển địa phương.</p>`
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
            <h1>★ Kho văn hóa Bản tôi</h1>
            <p class="text-muted">Nơi học sinh tự hào kể câu chuyện trang phục, ẩm thực, lễ hội của dân tộc mình.</p>
          </div>
          <span class="chip chip-star">Không gian văn hóa lành mạnh · Có kiểm duyệt</span>
        </div>

        <div class="grid-2 reveal-up">
          <div class="stack-md">
            ${visiblePosts
              .map((p) => {
                const author = profilesMap[p.authorId];
                return `
                  <article class="card ${p.approved ? '' : 'card-star'} stack-sm">
                    <div class="row-between">
                      <span class="chip">${esc(p.ethnicity)} · ${esc(p.category)}</span>
                      <span class="chip ${p.approved ? '' : 'chip-star'}">${p.approved ? 'Đã đăng bảng tin' : 'Chờ Thầy/Cô duyệt'}</span>
                    </div>
                    <h3>${esc(p.title)}</h3>
                    <p>${esc(p.story)}</p>
                    <p class="text-muted">Người kể: ${esc(author ? author.fullName : 'Học sinh nội trú')}</p>
                    ${
                      canApprove && !p.approved
                        ? `<div><button type="button" class="btn btn-primary btn-sm" data-action="approve-culture" data-id="${p.id}">Duyệt đăng bài viết</button></div>`
                        : ''
                    }
                  </article>`;
              })
              .join('')}
          </div>

          <form class="card stack-md" data-form="create-culture-post">
            <h3>Đóng góp câu chuyện bản làng</h3>
            <div class="grid-2">
              <div class="field">
                <label>Dân tộc</label>
                <input name="ethnicity" class="input" value="Mông" required />
              </div>
              <div class="field">
                <label>Chủ đề</label>
                <select name="category" class="select">
                  <option value="Trang phục & Hoa văn">Trang phục & Hoa văn</option>
                  <option value="Ẩm thực bản làng">Ẩm thực bản làng</option>
                  <option value="Lễ hội truyền thống">Lễ hội truyền thống</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Tiêu đề bài viết</label>
              <input name="title" class="input" placeholder="Ví dụ: Tiếng khèn gọi bạn mùa xuân..." required />
            </div>
            <div class="field">
              <label>Câu chuyện của em</label>
              <textarea name="story" class="textarea" placeholder="Kể lại nét đẹp văn hóa của gia đình và bản làng em..." required></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Gửi bài cho Thầy/Cô duyệt</button>
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
            <p class="text-muted">Cấp tài khoản năm học mới, nhập danh sách CSV (có Dry-run) & in thẻ QR học sinh khổ A4.</p>
          </div>
          <div class="tabs-bar" role="tablist">
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'accounts'}" data-action="switch-tab" data-module="admin" data-tab="accounts">Nhập CSV & Tài khoản</button>
            <button type="button" role="tab" class="tab-btn" aria-selected="${tab === 'qr-print'}" data-action="switch-tab" data-module="admin" data-tab="qr-print">In thẻ QR học sinh (A4)</button>
          </div>
        </div>

        ${
          tab === 'accounts'
            ? `<div class="grid-2 reveal-up">
                <form class="card stack-md" data-form="csv-import">
                  <h3>Nhập danh sách tài khoản hàng loạt từ CSV</h3>
                  <p class="text-muted">Định dạng dòng: <span class="code-pill">Mã,Họ tên,Vai trò,Lớp,Phòng,Dân tộc</span></p>
                  <textarea name="csvText" class="textarea" aria-label="Dữ liệu CSV">${esc(sampleCsv)}</textarea>
                  <div class="row-wrap">
                    <button type="submit" name="mode" value="dry-run" class="btn btn-secondary">Kiểm tra thử (Dry-run)</button>
                    <button type="submit" name="mode" value="commit" class="btn btn-primary">Tạo tài khoản hàng loạt</button>
                  </div>
                  ${
                    state.ui.csvPreview
                      ? `<div class="alert alert-info">
                          Kết quả kiểm tra thử: <strong>${state.ui.csvPreview.validCount} dòng hợp lệ</strong> · ${state.ui.csvPreview.errorCount} dòng lỗi.
                        </div>`
                      : ''
                  }
                </form>

                <div class="card stack-md">
                  <h3>Danh bạ tài khoản toàn trường (${state.profiles.length})</h3>
                  <div class="table-wrap">
                    <table class="data-table">
                      <thead><tr><th>Mã</th><th>Họ và tên</th><th>Vai trò</th><th>Lớp/Phòng</th></tr></thead>
                      <tbody>
                        ${state.profiles
                          .map(
                            (p) => `
                          <tr>
                            <td><span class="code-pill">${esc(p.code)}</span></td>
                            <td><strong>${esc(p.fullName)}</strong></td>
                            <td>${esc(p.roles.join(', '))}</td>
                            <td>${esc(p.className || '—')} ${p.room ? `· P.${esc(p.room)}` : ''}</td>
                          </tr>`,
                          )
                          .join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>`
            : `<div class="stack-md reveal-up">
                <div class="row-between no-print">
                  <p class="text-muted">Dàn sẵn 2 cột chuẩn khổ giấy A4 (8 thẻ/trang) có chữ ký số Ed25519 ngoại tuyến:</p>
                  <button type="button" class="btn btn-primary" data-action="print-a4">In trang A4 (8 thẻ/trang)</button>
                </div>
                <div class="qr-sheet-grid">
                  ${students
                    .slice(0, 8)
                    .map(
                      (s) => `
                    <div class="card qr-print-card row-between" style="align-items:center">
                      <div class="stack-sm">
                        <span class="chip">THẺ NỘI TRÚ BẢN NHÀ</span>
                        <h3>${esc(s.fullName)}</h3>
                        <p class="text-muted">Mã: <strong>${esc(s.code)}</strong> · Lớp ${esc(s.className)}</p>
                        <p class="text-muted">Phòng KTX: <strong>${esc(s.room)}</strong></p>
                      </div>
                      <div class="qr-box" style="width:6.2rem;height:6.2rem" data-qr="${esc(s.qrToken)}"></div>
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
