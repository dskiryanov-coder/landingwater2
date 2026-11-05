(async (page) => {
  const base = 'http://localhost:4173/';
  const checks = [];
  const assert = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
  let loaderRequests = 0;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://crm-aquadom.ru/**', async route => {
    loaderRequests++;
    await route.fulfill({ contentType: 'application/javascript', body: `const host=document.querySelector('#crm-mount'); const node=document.createElement('div'); node.className='b24-form-content'; node.innerHTML='<label>Телефон<input type="tel" name="phone" autocomplete="tel"></label><button type="button">Тестовая форма без отправки</button>'; host.append(node);` });
  });
  await page.goto(base);
  assert(loaderRequests === 0, 'CRM is not requested before opening');
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page overflow at ' + width);
  }
  assert(await page.locator('h1').count() === 1, 'Exactly one h1');
  assert(await page.locator('.system').count() === 6, 'Six system directions');
  await page.locator('img').evaluateAll(images => images.forEach(img => { img.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.images].every(img => img.complete));
  assert(await page.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), 'All images load');
  assert(await page.evaluate(() => document.fonts.check('600 18px Manrope')), 'Local Manrope font loads');
  const buttons = page.locator('.system [data-open-crm]');
  for (let i = 0; i < await buttons.count(); i++) {
    const button = buttons.nth(i);
    const expected = await button.getAttribute('data-system');
    await button.click();
    await page.locator('#crm-status').waitFor({ state: 'hidden' });
    assert(await page.locator('#crm-dialog').evaluate(el => el.open), 'Dialog opens for ' + expected);
    assert(await page.locator('#crm-title').textContent() === expected, 'Correct context for ' + expected);
    assert(await page.locator('#crm-fallback').isHidden(), 'Form success state for ' + expected);
    await page.keyboard.press('Escape');
    assert(await button.evaluate(el => document.activeElement === el), 'Focus restored for ' + expected);
  }
  assert(loaderRequests === 1, 'Loader initialized once across six openings');
  assert(await page.locator('[data-b24-form="inline/3/jjh64m"]').count() === 1, 'Single supplied Bitrix identity');
  const problem = page.locator('[data-problem="iron"]');
  await problem.click();
  assert(await problem.getAttribute('aria-pressed') === 'true', 'Problem choice exposes pressed state');
  assert(await page.locator('#problem-result-link').getAttribute('href') === '#system-iron', 'Problem points to correct system');
  await problem.click();
  assert(await page.locator('#problem-result-link').getAttribute('href') === '#systems', 'Problem can be cleared');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.menu-toggle').click();
  assert(await page.locator('#mobile-nav').isVisible(), 'Mobile menu opens');
  await page.keyboard.press('Escape');
  assert(await page.locator('#mobile-nav').isHidden(), 'Mobile menu closes with Escape');
  await page.locator('details summary').first().click();
  assert(await page.locator('details').first().getAttribute('open') !== null, 'FAQ expands');
  await page.locator('.mobile-cta [data-open-crm]').click();
  assert(await page.locator('#crm-title').textContent() === 'Подбор системы', 'General CTA resets previous system context');
  assert(await page.locator('.mobile-cta').evaluate(el => getComputedStyle(el).visibility) === 'hidden', 'Sticky CTA does not cover dialog');
  await page.locator('.dialog-close').click();

  await page.unroute('https://crm-aquadom.ru/**');
  await page.route('https://crm-aquadom.ru/**', route => route.abort('failed'));
  await page.goto(base);
  await page.locator('.hero [data-open-crm]').click();
  await page.locator('#crm-fallback').waitFor({ state: 'visible' });
  assert(await page.locator('#crm-status').isHidden(), 'Network failure clears loading state');
  assert(await page.locator('#crm-fallback a[href="tel:+79147071057"]').isVisible(), 'Network failure provides a phone contact');
  await page.keyboard.press('Escape');

  await page.unroute('https://crm-aquadom.ru/**');
  await page.route('https://crm-aquadom.ru/**', route => route.fulfill({ contentType: 'application/javascript', body: 'void 0;' }));
  await page.goto(base);
  await page.clock.install();
  await page.locator('.hero [data-open-crm]').click();
  await page.clock.fastForward(16000);
  assert(await page.locator('#crm-fallback').isVisible(), 'No-render timeout provides fallback');
  await page.evaluate(() => {
    const node = document.createElement('div'); node.className = 'b24-form-content';
    node.innerHTML = '<label>Телефон<input type="tel"></label>'; document.querySelector('#crm-mount').append(node);
  });
  await page.locator('#crm-fallback').waitFor({ state: 'hidden' });
  assert(await page.locator('#crm-mount').isVisible(), 'Late form recovers after timeout');
  await page.clock.resume();
  await page.keyboard.press('Escape');
  await page.unroute('https://crm-aquadom.ru/**');
  assert(errors.length === 0, 'No JavaScript exceptions');
  return { passed: checks.length, checks, noExternalSubmissions: true };
})
