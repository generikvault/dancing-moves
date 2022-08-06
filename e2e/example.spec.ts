import { test, expect } from '@bgotink/playwright-coverage';
/*
test('homepage has Playwright in title and get started link linking to the intro page', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);

  // create a locator
  const getStarted = page.locator('text=Get Started');

  // Expect an attribute "to be strictly equal" to the value.
  await expect(getStarted).toHaveAttribute('href', '/docs/intro');

  // Click the get started link.
  await getStarted.click();

  // Expects the URL to contain intro.
  await expect(page).toHaveURL(/.*intro/);
});
*/
//const baseUrl = 'https://mvolkert.github.io/dancing-moves';

test('test dancing moves', async ({ page }) => {
  // Go to baseUrl/move/new?sort=dance&sort=courseDate&sort=order&sort=name&relationTypes=start&relationTypes=end&displayType=cytoscape
  await page.goto(`/move/new`);
  // Click mat-nav-list[role="navigation"] >> text=Dances
  await page.locator('mat-nav-list[role="navigation"] >> text=Dances').click();
  await expect(page).toHaveURL(`/dances?sort=dance&sort=courseDate&sort=order&sort=name&relationTypes=start&relationTypes=end&displayType=cytoscape`);
  // Click [aria-label="create new"]
  await page.locator('[aria-label="create new"]').click();
  await expect(page).toHaveURL(`/dance/new?sort=dance&sort=courseDate&sort=order&sort=name&relationTypes=start&relationTypes=end&displayType=cytoscape`);
  // Click div:has-text("Name *") >> nth=2
  await page.locator('div:has-text("Name *")').nth(2).click();
  // Fill #mat-input-10
  await page.locator('#mat-input-10').fill('Bachata');
  // Click #mat-input-11
  await page.locator('#mat-input-11').click();
  // Fill #mat-input-11
  await page.locator('#mat-input-11').fill('Latin');
  // Click button:has-text("Save")
  await page.locator('button:has-text("Save")').click();
  await expect(page).toHaveURL(`/dance/Bachata?sort=dance&sort=courseDate&sort=order&sort=name&relationTypes=start&relationTypes=end&displayType=cytoscape`);
  // Click text=Dancing Moves
  await page.locator('text=Dancing Moves').click();
  await expect(page).toHaveURL(`/moves?sort=dance&sort=courseDate&sort=order&sort=name&relationTypes=start&relationTypes=end&displayType=cytoscape`);
  // Click [aria-label="create new"]
  await page.locator('[aria-label="create new"]').click();
  await expect(page).toHaveURL(`/move/new?sort=dance&sort=courseDate&sort=order&sort=name&relationTypes=start&relationTypes=end&displayType=cytoscape`);
  // Click #mat-input-16
  await page.locator('#mat-input-16').click();
  // Fill #mat-input-16
  await page.locator('#mat-input-16').fill('Basico');
  // Click div:has-text("Dance *") >> nth=2
  await page.locator('div:has-text("Dance *")').nth(2).click();
  // Click text=Bachata
  await page.locator('text=Bachata').click();
  // Click div:has-text("Type *") >> nth=2
  await page.locator('div:has-text("Type *")').nth(2).click();
  // Click #mat-select-26 div >> nth=2
  await page.locator('#mat-select-26 div').nth(2).click();
  // Click #mat-select-value-27 span
  await page.locator('#mat-select-value-27 span').click();
  // Click div:has-text("Type *") >> nth=2
  await page.locator('div:has-text("Type *")').nth(2).click();
  // Click text=Name *BachataDance *OrderCountType * Name VerifiedStart MoveEnd MoveContainsRela
  await page.locator('text=Name *BachataDance *OrderCountType * Name VerifiedStart MoveEnd MoveContainsRela').click();
});
