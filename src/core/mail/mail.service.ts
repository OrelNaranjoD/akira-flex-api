import { Injectable, HttpException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

/**
 * Service for sending emails using templates.
 * @class MailService
 */
@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  /**
   * Renders a Handlebars template with context.
   * @param templateName Name of the template file (without .hbs).
   * @param context Context object for template variables.
   * @returns Rendered HTML string.
   */
  private renderTemplate(templateName: string, context: Record<string, any>): string {
    let templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(
        process.cwd(),
        'src',
        'core',
        'mail',
        'templates',
        `${templateName}.hbs`
      );
    }
    const source = fs.readFileSync(templatePath, 'utf8');
    const compiled = handlebars.compile(source);
    return compiled(context);
  }

  /**
   * Sends an email using a Handlebars template.
   * @param to Recipient email address.
   * @param subject Email subject.
   * @param template Template name (without .hbs).
   * @param context Context for template rendering.
   * @returns Promise resolving to the email sending result.
   */
  async sendMail(to: string, subject: string, template: string, context: Record<string, any>) {
    const html = this.renderTemplate(template, context);
    if (process.env.MAIL_DISABLE_SEND === 'true') {
      console.log('[MailService] Sending disabled.');
      return { disabled: true, to, subject, html };
    }
    try {
      return await this.transporter.sendMail({
        from: '"AkiraFlex" <no-reply@akirasoftware.cl>',
        to,
        subject,
        html,
      });
    } catch (error: any) {
      console.error('Error enviando correo:', error);
      if (error.responseCode === 550) {
        throw new HttpException('Invalid email address', 550);
      }
      throw new HttpException((error.message as Error) || 'Internal server error', 500);
    }
  }

  /**
   * Sends a verification email.
   * @param to Recipient email address.
   * @param name Recipient's name.
   * @param token Verification token.
   * @returns Promise resolving when the email is sent.
   */
  async sendVerificationEmail(to: string, name: string, token: string) {
    const verificationLink = process.env.FRONTEND_URL + `/verify-email?token=${token}`;
    const subject = 'Bienvenido a AkiraFlex - Verifica tu correo';
    const context = {
      name: name,
      verificationUrl: verificationLink,
      year: new Date().getFullYear(),
    };
    await this.sendMail(to, subject, 'welcome', context);
  }

  /**
   * Sends recovery password email.
   * @param to Recipient email address.
   * @param name Recipient's name.
   * @param token Recovery token.
   * @returns Promise resolving when the email is sent.
   */
  async sendRecoveryPasswordEmail(to: string, name: string, token: string) {
    const resetLink = process.env.FRONTEND_URL + `/reset-password?token=${token}`;
    const subject = 'AkiraFlex - Recupera tu contraseña';
    const context = {
      name: name,
      resetLink: resetLink,
      year: new Date().getFullYear(),
    };
    await this.sendMail(to, subject, 'reset-password', context);
  }
}
