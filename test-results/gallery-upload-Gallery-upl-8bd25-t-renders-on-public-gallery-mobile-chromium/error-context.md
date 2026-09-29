# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gallery-upload.spec.ts >> Gallery upload → public site >> uploads image, stores in school-media bucket, renders on public gallery
- Location: tests\e2e\gallery-upload.spec.ts:15:3

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\USER\AppData\Local\Temp\cursor-sandbox-cache\ef9498b5970139cd9ca00e5d1dfe9cf7\playwright\chromium_headless_shell-1234\chrome-headless-shell-win64\chrome-headless-shell.exe
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```