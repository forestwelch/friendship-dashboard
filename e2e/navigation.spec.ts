import { test, expect } from '@playwright/test';

test.describe('Navigation flows', () => {
  test('should navigate from home to friend page without errors', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Click on a friend link (assuming "Daniel" exists)
    const friendLink = page.getByRole('link', { name: /daniel/i }).first();
    if (await friendLink.isVisible()) {
      await friendLink.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Check URL changed
      await expect(page).toHaveURL(/\/daniel/);
      
      // Verify no DOM manipulation errors
      const domErrors = errors.filter(err => 
        err.includes('removeChild') || 
        err.includes('insertBefore') || 
        err.includes('appendChild') ||
        err.includes('not a child')
      );
      
      expect(domErrors).toHaveLength(0);
    }
  });

  test('should navigate from friend page to home without errors', async ({ page }) => {
    // Start at friend page
    await page.goto('/daniel');
    await expect(page).toHaveURL(/\/daniel/);
    
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Click home link
    const homeLink = page.getByRole('link', { name: /home/i }).first();
    await homeLink.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Check URL changed
    await expect(page).toHaveURL('/');
    
    // Verify no DOM manipulation errors
    const domErrors = errors.filter(err => 
      err.includes('removeChild') || 
      err.includes('insertBefore') || 
      err.includes('appendChild') ||
      err.includes('not a child')
    );
    
    expect(domErrors).toHaveLength(0);
  });

  test('should navigate from friend page to admin without errors', async ({ page }) => {
    await page.goto('/daniel');
    await expect(page).toHaveURL(/\/daniel/);
    
    await page.waitForLoadState('networkidle');
    
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Click admin link
    const adminLink = page.getByRole('link', { name: /admin/i }).first();
    await adminLink.click();
    
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/admin');
    
    const domErrors = errors.filter(err => 
      err.includes('removeChild') || 
      err.includes('insertBefore') || 
      err.includes('appendChild') ||
      err.includes('not a child')
    );
    
    expect(domErrors).toHaveLength(0);
  });

  test('should navigate through multiple pages without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Navigate through multiple pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/daniel');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/daniel');
    await page.waitForLoadState('networkidle');
    
    // Check for DOM errors
    const domErrors = errors.filter(err => 
      err.includes('removeChild') || 
      err.includes('insertBefore') || 
      err.includes('appendChild') ||
      err.includes('not a child')
    );
    
    expect(domErrors).toHaveLength(0);
  });

  test('should handle rapid navigation without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Rapidly navigate between pages
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.goto('/daniel');
      await page.goto('/admin');
    }
    
    await page.waitForLoadState('networkidle');
    
    const domErrors = errors.filter(err => 
      err.includes('removeChild') || 
      err.includes('insertBefore') || 
      err.includes('appendChild') ||
      err.includes('not a child')
    );
    
    expect(domErrors).toHaveLength(0);
  });
});


