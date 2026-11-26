/**
 * BẢN NHÀ — Thuật toán nghiệp vụ chuẩn hóa (Pure Domain Selectors & Engines)
 * - Không lưu trùng dữ liệu dẫn xuất (điểm TB, quân số bếp, ghép đồ cũ đều tính từ nguồn đơn nhất).
 */
(function initDomain(global) {
  const ROLE_LABELS = {
    student: 'Học sinh nội trú',
    parent: 'Phụ huynh ở bản',
    teacher: 'Giáo viên chủ nhiệm',
    dorm_staff: 'Cán bộ Quản sinh',
    medical_staff: 'Nhân viên Y tế',
    kitchen_staff: 'Cán bộ Nhà bếp',
    admin: 'Quản trị nhà trường',
  };

  const MEAL_CUTOFF_HOURS = {
    breakfast: 5, // Trước 05:30 sáng cùng ngày
    lunch: 9, // Trước 09:30 sáng cùng ngày
    dinner: 15, // Trước 15:30 chiều cùng ngày
  };

  const MEAL_LABELS = {
    breakfast: 'Bữa sáng',
    lunch: 'Bữa trưa',
    dinner: 'Bữa tối',
  };

  /**
   * 1. Điểm trung bình môn học kỳ 1 theo hệ số 1 - 2 - 3:
   * (Miệng + 15p)×1 + Giữa kỳ×2 + Cuối kỳ×3
   */
  function calcWeightedAverage(row) {
    let weightedSum = 0;
    let totalWeight = 0;
    const add = (val, w) => {
      if (typeof val === 'number' && !Number.isNaN(val)) {
        weightedSum += val * w;
        totalWeight += w;
      }
    };
    add(row.oral, 1);
    add(row.quiz15, 1);
    add(row.midterm, 2);
    add(row.finalExam, 3);
    if (totalWeight === 0) return null;
    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  /**
   * 2. Kiểm tra điều kiện báo cắt suất theo giờ Việt Nam
   */
  function canModifyMealCut(mealDate, mealType, todayIso, currentHour) {
    if (mealDate > todayIso) return true;
    if (mealDate < todayIso) return false;
    const limit = MEAL_CUTOFF_HOURS[mealType] ?? 9;
    return currentHour <= limit;
  }

  /**
   * 3. Liệt kê các bữa ăn nằm trong khoảng nghỉ về bản [fromDate..toDate]
   *    để tự động đồng bộ sang bảng `mealCuts` (tránh chồng chéo dữ liệu KTX & Bếp).
   */
  function expandLeaveMeals(fromDate, toDate) {
    const slots = [];
    const start = new Date(`${fromDate}T00:00:00Z`);
    const end = new Date(`${toDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return slots;
    }
    const maxDays = 14;
    for (let i = 0; i <= maxDays; i++) {
      const cur = new Date(start.getTime() + i * 86400000);
      if (cur > end) break;
      const iso = cur.toISOString().slice(0, 10);
      if (iso === fromDate && iso === toDate) {
        slots.push({ date: iso, meal: 'lunch' }, { date: iso, meal: 'dinner' });
      } else if (iso === fromDate) {
        slots.push({ date: iso, meal: 'dinner' });
      } else if (iso === toDate) {
        slots.push({ date: iso, meal: 'breakfast' }, { date: iso, meal: 'lunch' });
      } else {
        slots.push(
          { date: iso, meal: 'breakfast' },
          { date: iso, meal: 'lunch' },
          { date: iso, meal: 'dinner' },
        );
      }
    }
    return slots;
  }

  /**
   * 4. Chấm điểm ghép cặp Ngân hàng đồ cũ (Greedy Priority Matching):
   *    Cùng danh mục (+50), khớp cỡ/khối (+25), áo ấm mùa đông (+20), mức cần gấp (+15).
   */
  function computeDonationMatches(donations, requests, profilesById) {
    const openOffers = donations.filter((d) => d.status === 'available');
    const openReqs = requests.filter((r) => r.status === 'open');
    const usedOfferIds = new Set();
    const pairs = [];

    const candidates = [];
    for (const req of openReqs) {
      for (const off of openOffers) {
        if (off.category !== req.category) continue;
        if (off.donorId === req.studentId) continue;
        let score = 50;
        const reasons = ['Cùng loại vật phẩm'];
        if (off.sizeOrGrade.toLowerCase() === req.sizeOrGrade.toLowerCase()) {
          score += 25;
          reasons.push(`Đúng cỡ/khối (${off.sizeOrGrade})`);
        }
        if (off.category === 'winter_coat') {
          score += 20;
          reasons.push('Ưu tiên giữ ấm mùa đông vùng cao');
        }
        if (req.urgency === 'high') {
          score += 15;
          reasons.push('Học sinh đang cần gấp');
        }
        candidates.push({ req, off, score, reason: reasons.join(' · ') });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const matchedReqIds = new Set();
    for (const c of candidates) {
      if (usedOfferIds.has(c.off.id) || matchedReqIds.has(c.req.id)) continue;
      usedOfferIds.add(c.off.id);
      matchedReqIds.add(c.req.id);
      const student = profilesById[c.req.studentId];
      pairs.push({
        offerId: c.off.id,
        requestId: c.req.id,
        itemTitle: c.off.title,
        category: c.off.category,
        sizeOrGrade: c.off.sizeOrGrade,
        recipientName: student ? student.fullName : c.req.studentId,
        recipientRoom: student ? student.room : '—',
        score: c.score,
        reason: c.reason,
      });
    }
    return pairs;
  }

  /**
   * 5. Trắc nghiệm hướng nghiệp 30 câu Holland (RIASEC)
   */
  const RIASEC_INFO = {
    R: {
      name: 'Thực tế – Kỹ thuật (R)',
      fit: 'Kỹ thuật điện, cơ khí nông lâm, chế biến nông sản, xây dựng hạ tầng vùng cao.',
    },
    I: {
      name: 'Nghiên cứu – Khoa học (I)',
      fit: 'Y dược, nông học giống cây trồng dược liệu, công nghệ thông tin, xét nghiệm.',
    },
    A: {
      name: 'Nghệ thuật – Sáng tạo (A)',
      fit: 'Thiết kế thổ cẩm ứng dụng, truyền thông du lịch bản địa, bảo tồn văn hóa.',
    },
    S: {
      name: 'Xã hội – Cộng đồng (S)',
      fit: 'Sư phạm vùng cao (cử tuyển), điều dưỡng y tế thôn bản, công tác xã hội.',
    },
    E: {
      name: 'Quản lý – Khởi nghiệp (E)',
      fit: 'Hợp tác xã nông sản đặc sản, quản trị du lịch cộng đồng homestay, kinh tế nông nghiệp.',
    },
    C: {
      name: 'Nghiệp vụ – Tổ chức (C)',
      fit: 'Kế toán xã/trường, hành chính công, tài chính ngân hàng chính sách.',
    },
  };

  function scoreRiasec(answersByGroup) {
    const entries = Object.entries(RIASEC_INFO).map(([code, meta]) => ({
      code,
      score: Number(answersByGroup[code] || 0),
      ...meta,
    }));
    entries.sort((a, b) => b.score - a.score);
    const top2 = entries.slice(0, 2);
    return {
      codePair: `${top2[0].code}${top2[1].code}`,
      primary: top2[0],
      secondary: top2[1],
      breakdown: entries,
    };
  }

  global.BanNha = global.BanNha || {};
  global.BanNha.domain = {
    ROLE_LABELS,
    MEAL_LABELS,
    MEAL_CUTOFF_HOURS,
    RIASEC_INFO,
    calcWeightedAverage,
    canModifyMealCut,
    expandLeaveMeals,
    computeDonationMatches,
    scoreRiasec,
  };
})(window);
