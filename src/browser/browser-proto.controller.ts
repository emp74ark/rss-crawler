import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import puppeteer, { Browser, TimeoutError } from 'puppeteer';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { ConfigService } from '@nestjs/config';

@Controller()
export class BrowserProtoController {
  constructor(private configService: ConfigService) {}

  #containsCaptcha(html: string) {
    return html.includes('captcha');
  }

  @GrpcMethod('BrowserService', 'GetDocument')
  async getDocument({ url }: { url: string }): Promise<{
    content: string;
    error: boolean;
    errorMessage: string;
  }> {
    const timeout = Number(this.configService.get<string>('PUPPETEER_LIMIT'));

    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        timeout,
      });

      const page = await browser.newPage();
      await page.goto(url, {
        timeout,
        waitUntil: 'domcontentloaded',
      });

      const bodyHtml: string = await page.evaluate(
        () => document.body.innerHTML,
      );
      const document: Document = new JSDOM(bodyHtml).window.document;
      const read = new Readability(document).parse();

      if (!read?.content) {
        if (this.#containsCaptcha(bodyHtml)) {
          return { content: '', error: true, errorMessage: 'captcha' };
        } else {
          return { content: '', error: true, errorMessage: 'no_content' };
        }
      }

      return { content: read.content, error: false, errorMessage: '' };
    } catch (error) {
      if (error instanceof TimeoutError) {
        return { content: '', error: true, errorMessage: 'timeout' };
      }
      return { content: '', error: true, errorMessage: 'unknown' };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
