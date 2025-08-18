import sgMail from '@sendgrid/mail';
import { IEmailService } from '../../application/services/IEmailService';

export interface SendGridConfig {
  apiKey: string;
  from: string;
  templates: {
    welcome: string;
    passwordReset: string;
    projectInvite: string;
  };
}

export class SendGridEmailService implements IEmailService {
  constructor(private config: SendGridConfig) {
    sgMail.setApiKey(config.apiKey);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const msg = {
      to: email,
      from: this.config.from,
      templateId: this.config.templates.welcome,
      dynamicTemplateData: {
        name,
        loginUrl: 'https://app.besspro.com',
      },
    };

    await sgMail.send(msg);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `https://app.besspro.com/reset-password?token=${resetToken}`;
    
    const msg = {
      to: email,
      from: this.config.from,
      templateId: this.config.templates.passwordReset,
      dynamicTemplateData: {
        resetUrl,
        expiryHours: 1,
      },
    };

    await sgMail.send(msg);
  }

  async sendProjectInviteEmail(email: string, projectName: string): Promise<void> {
    const msg = {
      to: email,
      from: this.config.from,
      templateId: this.config.templates.projectInvite,
      dynamicTemplateData: {
        projectName,
        platformUrl: 'https://app.besspro.com',
      },
    };

    await sgMail.send(msg);
  }
}