import { expect, test } from '@bgotink/playwright-coverage';
import { chromium } from '@playwright/test';
import { allure } from "allure-playwright";

//const baseUrl = 'https://mvolkert.github.io/dancing-moves';

let browser;

test.describe('basic functions', () => {

  test.beforeAll(async () => {
    browser = await chromium.launch();
    const page = await browser.newPage();
    test.setTimeout(120000);
    await page.goto(`/`);
    await browser.close();
  });

  test('test dancing moves', async ({ page }) => {
    allure.story("Some Story");
    allure.tag("Create Dance");
    allure.epic("Dance");
    await page.goto(`/`);

    await test.step('create dance', async () => {
      await page.locator('mat-nav-list[role="navigation"] >> text=Dances').click();
      await expect(page).toHaveURL(`/dances`);
      await page.locator('[aria-label="create new"]').click();
      await expect(page).toHaveURL(`/dance/new`);
      await page.getByRole('textbox', { name: 'Name' }).click();
      await page.getByRole('textbox', { name: 'Name' }).fill('Bachata');
      await page.getByRole('textbox', { name: 'Type' }).click();
      await page.getByRole('textbox', { name: 'Type' }).fill('Latin');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page).toHaveURL(`/dance/Bachata`);
    })

    await test.step('create move', async () => {
      await page.locator('mat-nav-list[role="navigation"] >> text=Dancing Moves').click();
      await expect(page).toHaveURL(`/moves`);
      await page.locator('[aria-label="create new"]').click();
      await expect(page).toHaveURL(`/move/new`);
      await page.getByRole('textbox', { name: 'Name' }).click();
      await page.getByRole('textbox', { name: 'Name' }).fill('Basico');
      await page.locator('app-move-page div').filter({ hasText: 'Dance' }).first().click();
      await page.locator('text=Bachata').click();
      await page.locator('app-move-page div').filter({ hasText: 'Type' }).first().click();
      await page.getByRole('button', { name: 'Save' }).click();
    });
  });
});
