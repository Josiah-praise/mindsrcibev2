import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import { fetch, FormData } from 'undici';

// ?  tested and works fine
@Injectable()
export class EmailService {
  private readonly URL = this.configService.getOrThrow<string>('MAILGUN_URL');
  private readonly MAILGUN_API_KEY =
    this.configService.getOrThrow<string>('MAILGUN_API_KEY');
  private readonly form = new FormData();
  constructor(private readonly configService: ConfigService) {}

  async getFormattedTemplate(
    path: string,
    values: { [key: string]: any },
  ): Promise<string> {
    const fileContent = await fs.readFile(path, 'utf-8');

    const template = Handlebars.compile(fileContent);
    const formattedTemplate = template(values);
    return formattedTemplate;
  }

  async sendMail(email: string, formattedTemplate: string, subject: string) {
    try {
      this.form.append('from', '<noreply@mail.praiseafk.tech>');
      this.form.append('to', email);
      this.form.append('subject', subject);
      this.form.append('text', formattedTemplate);
      this.form.append('html', formattedTemplate);
      const resp = await fetch(this.URL, {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              `api:${this.configService.getOrThrow<string>('MAILGUN_API_KEY')}`,
            ).toString('base64'),
        },
        body: this.form,
      });

      if (resp.ok) {
        return await resp.json();
      } else {
        throw new Error('Email not sent successfully');
      }
    } catch (err) {
      throw new ServiceUnavailableException({
        message: 'Error in sending email',
        error: err.message,
      });
    }
  }
}
