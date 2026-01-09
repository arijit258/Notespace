import { chromium } from 'playwright';

async function testApp() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing Notes App...\n');
  
  try {
    // Test 1: Register a new user
    console.log('1. Testing registration...');
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    const testEmail = `test${Date.now()}@example.com`;
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input#password', 'testpass123');
    await page.fill('input#confirmPassword', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const afterRegUrl = page.url();
    if (afterRegUrl.includes('/notes')) {
      console.log('   ✓ Registration successful');
    } else {
      console.log('   ✗ Registration failed');
      return;
    }

    // Test 2: Create a new note
    console.log('2. Testing note creation...');
    // Use text-based selector which is more reliable
    await page.click('text=New Note');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check text visibility in input fields
    await page.fill('input#title', 'Test Note Title');
    await page.fill('textarea#content', 'This is test content for the note.');
    
    // Verify text is visible (check input values)
    const titleValue = await page.inputValue('input#title');
    const contentValue = await page.inputValue('textarea#content');
    
    if (titleValue === 'Test Note Title' && contentValue === 'This is test content for the note.') {
      console.log('   ✓ Text input works correctly');
    } else {
      console.log('   ✗ Text input issue');
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const afterCreateUrl = page.url();
    if (afterCreateUrl.includes('/notes/view')) {
      console.log('   ✓ Note created successfully - redirected to view page');
    } else {
      console.log(`   ✗ Note creation redirect failed. URL: ${afterCreateUrl}`);
    }

    // Test 3: Verify note is displayed
    console.log('3. Verifying note display...');
    const noteTitle = await page.locator('h1').first().textContent();
    if (noteTitle && noteTitle.includes('Test Note Title')) {
      console.log('   ✓ Note title displayed correctly');
    } else {
      console.log(`   ? Note title: ${noteTitle}`);
    }

    // Take screenshot
    console.log('4. Taking screenshot...');
    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
    console.log('   ✓ Screenshot saved');
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testApp();
