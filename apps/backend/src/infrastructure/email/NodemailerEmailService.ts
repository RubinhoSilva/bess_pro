import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService } from '../../application/services/IEmailService';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class NodemailerEmailService implements IEmailService {
  private transporter: Transporter;

  constructor(private config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const mailOptions = {
      from: this.config.from,
      to: email,
      subject: 'Bem-vindo à BESS Pro',
      html: `
        <h1>Bem-vindo, ${name}!</h1>
        <p>Sua conta foi criada com sucesso na plataforma BESS Pro.</p>
        <p>Agora você pode começar a criar seus projetos de energia solar e armazenamento.</p>
        <p>Acesse: <a href="https://app.besspro.com">https://app.besspro.com</a></p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `https://app.besspro.com/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: this.config.from,
      to: email,
      subject: 'Redefinir Senha - BESS Pro',
      html: `
        <h1>Redefinir Senha</h1>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p><a href="${resetUrl}">Redefinir Senha</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou isso, ignore este email.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendProjectInviteEmail(email: string, projectName: string): Promise<void> {
    const mailOptions = {
      from: this.config.from,
      to: email,
      subject: `Você foi convidado para o projeto: ${projectName}`,
      html: `
        <h1>Convite para Projeto</h1>
        <p>Você foi convidado para colaborar no projeto <strong>${projectName}</strong>.</p>
        <p>Acesse a plataforma para visualizar o projeto:</p>
        <p><a href="https://app.besspro.com">Acessar BESS Pro</a></p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
