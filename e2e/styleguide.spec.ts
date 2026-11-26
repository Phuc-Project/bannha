import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.resolve(e2eDir, '..', 'docs', 'screenshots', 'gd0');

test.describe('Giai đoạn 0 — Giao diện Desktop 1280px & Di động 360px', () => {
  test.beforeAll(() => {
    mkdirSync(screenshotDir, { recursive: true });
  });

  test('trang chủ / hiển thị rõ bố cục Desktop có Sidebar và không tràn ngang', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    await expect(page.getByText('Ca trực Ký túc xá').first()).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);

    if (testInfo.project.name === 'desktop-1280') {
      await expect(page.getByLabel('Điều hướng nhân viên')).toBeVisible();
    }

    await page.screenshot({
      path: path.join(screenshotDir, `trang-chu-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('trang /dev/ui hiển thị trọn bộ design system và chụp đủ 5 màn mẫu vai trò', async ({
    page,
  }, testInfo) => {
    await page.goto('/dev/ui');

    await expect(
      page.getByRole('heading', { name: 'Hệ thống giao diện BẢN NHÀ' }).first(),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    if (testInfo.project.name === 'desktop-1280') {
      await expect(page.getByLabel('Mục lục Styleguide')).toBeVisible();
    }

    await expect(page.getByText('★ Sổ liên lạc Bản – Trường').first()).toBeVisible();
    await expect(page.getByText('★ Gia sư AI buổi tối').first()).toBeVisible();
    await expect(page.getByText('★ Kho văn hóa Bản tôi').first()).toBeVisible();

    await page.getByRole('button', { name: 'Giả lập: Đang chờ gửi' }).click();
    await expect(page.getByText('Đang chờ gửi 3 mục').first()).toBeVisible();

    await page.getByRole('button', { name: 'Giả lập: Đã đồng bộ' }).click();
    await expect(page.getByText('Đã đồng bộ 2 phút trước').first()).toBeVisible();

    const suffix = testInfo.project.name;
    await page.screenshot({
      path: path.join(screenshotDir, `styleguide-${suffix}.png`),
      fullPage: true,
    });

    const roleTabs = [
      { tab: 'Quản sinh', slug: 'quan-sinh' },
      { tab: 'Giáo viên', slug: 'giao-vien' },
      { tab: 'Học sinh', slug: 'hoc-sinh' },
      { tab: 'Phụ huynh', slug: 'phu-huynh' },
      { tab: 'Đăng nhập', slug: 'dang-nhap' },
    ] as const;

    for (const { tab, slug } of roleTabs) {
      const tabEl = page.getByRole('tab', { name: tab });
      await tabEl.scrollIntoViewIfNeeded();
      await tabEl.click();
      const panel = page.locator('#role-previews [role="tabpanel"]');
      await expect(panel).toBeVisible();
      await panel.screenshot({
        path: path.join(screenshotDir, `${slug}-${suffix}.png`),
      });
    }
  });
});
