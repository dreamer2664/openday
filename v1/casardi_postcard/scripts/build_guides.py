"""Render the self-contained operator guide to an A4 PDF (maintainers only).
Requires QA Playwright/Chromium. No external fonts, URLs or web requests.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--no-sandbox'])
        try:
            page=await b.new_page()
            await page.goto((ROOT/'docs/GUIDA_RAPIDA.html').as_uri())
            await page.pdf(path=str(ROOT/'docs/GUIDA_RAPIDA.pdf'),format='A4',print_background=True,prefer_css_page_size=True)
        finally:await b.close()
    print('PDF A4 generated from docs/GUIDA_RAPIDA.html')

if __name__=='__main__':asyncio.run(main())
