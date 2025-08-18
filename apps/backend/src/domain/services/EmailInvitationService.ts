import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User } from '../entities/User';
import { Team } from '../entities/Team';

export interface EmailInvitationService {
  sendWelcomeEmail(user: User, team: Team, invitationToken: string): Promise<void>;
  sendTeamInviteEmail(invitee: User, team: Team, inviter: User, invitationToken: string): Promise<void>;
  sendPasswordResetEmail(user: User, resetToken: string): Promise<void>;
  generateInvitationToken(): string;
}

export class DefaultEmailInvitationService implements EmailInvitationService {
  private transporter: nodemailer.Transporter | null = null;

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    
    if (emailProvider === 'nodemailer') {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'localhost',
        port: parseInt(process.env.EMAIL_PORT || '1025'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        } : undefined,
      });
    }

    return this.transporter!;
  }

  generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendWelcomeEmail(user: User, team: Team, invitationToken: string): Promise<void> {
    const welcomeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3003'}/invite/setup-password?token=${invitationToken}&email=${user.getEmail().getValue()}`;
    
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    
    // Log do email (sempre fazer log para debug)
    console.log(`
    📧 EMAIL DE BOAS-VINDAS 📧
    ═══════════════════════════════════════════════════════════════════════
    Para: ${user.getEmail().getValue()}
    Nome: ${user.getName().getValue()}
    Team: ${team.getName().getValue()}
    Provider: ${emailProvider}
    ═══════════════════════════════════════════════════════════════════════
    
    Olá ${user.getName().getValue()}!
    
    Você foi convidado(a) para fazer parte do team "${team.getName().getValue()}" na plataforma BESS Pro!
    
    Para completar seu cadastro e definir sua senha, clique no link abaixo:
    
    🔗 ${welcomeUrl}
    
    Este link é válido por 24 horas.
    
    Bem-vindo(a) ao BESS Pro! 🚀
    ═══════════════════════════════════════════════════════════════════════
    `);
    
    // Envio real via SMTP (Mailpit/Nodemailer)
    if (emailProvider === 'nodemailer') {
      try {
        const transporter = await this.getTransporter();
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@besspro.dev',
          to: user.getEmail().getValue(),
          subject: `Bem-vindo ao team ${team.getName().getValue()} - BESS Pro`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Bem-vindo ao BESS Pro!</h1>
              
              <p>Olá <strong>${user.getName().getValue()}</strong>,</p>
              
              <p>Você foi convidado(a) para fazer parte do team "<strong>${team.getName().getValue()}</strong>" na plataforma BESS Pro!</p>
              
              <p>Para completar seu cadastro e definir sua senha, clique no botão abaixo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${welcomeUrl}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Definir Minha Senha
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Este link é válido por 24 horas.</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px;">
                Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:<br>
                <a href="${welcomeUrl}" style="color: #3b82f6;">${welcomeUrl}</a>
              </p>
              
              <p style="color: #666; font-size: 12px;">
                Bem-vindo(a) ao BESS Pro! 🚀
              </p>
            </div>
          `,
        });

        console.log(`✅ Email enviado com sucesso para ${user.getEmail().getValue()}`);
      } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        throw error;
      }
    }
  }

  async sendTeamInviteEmail(invitee: User, team: Team, inviter: User, invitationToken: string): Promise<void> {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3003'}/invite/setup-password?token=${invitationToken}&email=${invitee.getEmail().getValue()}`;
    
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    const inviteeRole = invitee.getRole().getValue();
    
    // Traduzir role para português
    const roleNames: Record<string, string> = {
      'admin': 'Administrador',
      'vendedor': 'Vendedor',
      'viewer': 'Visualizador'
    };
    const roleDisplayName = roleNames[inviteeRole] || inviteeRole;
    
    // Log do email (sempre fazer log para debug)
    console.log(`
    👥 EMAIL DE CONVITE PARA TEAM 👥
    ═══════════════════════════════════════════════════════════════════════
    Para: ${invitee.getEmail().getValue()}
    Nome: ${invitee.getName().getValue()}
    Team: ${team.getName().getValue()}
    Role: ${roleDisplayName}
    Convidado por: ${inviter.getName().getValue()} (${inviter.getEmail().getValue()})
    Provider: ${emailProvider}
    ═══════════════════════════════════════════════════════════════════════
    
    Olá ${invitee.getName().getValue()}!
    
    Você foi convidado(a) por ${inviter.getName().getValue()} para fazer parte do team "${team.getName().getValue()}" como ${roleDisplayName}.
    
    Para aceitar o convite e definir sua senha, clique no link abaixo:
    
    🔗 ${inviteUrl}
    
    Este link é válido por 72 horas.
    
    Bem-vindo(a) ao BESS Pro! 🚀
    ═══════════════════════════════════════════════════════════════════════
    `);
    
    // Envio real via SMTP (Mailpit/Nodemailer)
    if (emailProvider === 'nodemailer') {
      try {
        const transporter = await this.getTransporter();
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@besspro.dev',
          to: invitee.getEmail().getValue(),
          subject: `Convite para o team ${team.getName().getValue()} - BESS Pro`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Você foi convidado para um team!</h1>
              
              <p>Olá <strong>${invitee.getName().getValue()}</strong>,</p>
              
              <p><strong>${inviter.getName().getValue()}</strong> convidou você para fazer parte do team "<strong>${team.getName().getValue()}</strong>" como <strong>${roleDisplayName}</strong>.</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">Detalhes do Convite:</h3>
                <p style="margin: 5px 0;"><strong>Team:</strong> ${team.getName().getValue()}</p>
                <p style="margin: 5px 0;"><strong>Sua função:</strong> ${roleDisplayName}</p>
                <p style="margin: 5px 0;"><strong>Convidado por:</strong> ${inviter.getName().getValue()}</p>
              </div>
              
              <p>Para aceitar o convite e definir sua senha, clique no botão abaixo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Aceitar Convite
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Este link é válido por 72 horas.</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px;">
                Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:<br>
                <a href="${inviteUrl}" style="color: #3b82f6;">${inviteUrl}</a>
              </p>
              
              <p style="color: #666; font-size: 12px;">
                Bem-vindo(a) ao BESS Pro! 🚀
              </p>
            </div>
          `,
        });

        console.log(`✅ Email de convite enviado com sucesso para ${invitee.getEmail().getValue()}`);
      } catch (error) {
        console.error('❌ Erro ao enviar email de convite:', error);
        throw error;
      }
    }
  }

  async sendPasswordResetEmail(user: User, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3003'}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.getEmail().getValue())}`;
    
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    
    // Log do email (sempre fazer log para debug)
    console.log(`
    🔐 EMAIL DE REDEFINIÇÃO DE SENHA 🔐
    ═══════════════════════════════════════════════════════════════════════
    Para: ${user.getEmail().getValue()}
    Nome: ${user.getName().getValue()}
    Provider: ${emailProvider}
    ═══════════════════════════════════════════════════════════════════════
    
    Olá ${user.getName().getValue()}!
    
    Você solicitou a redefinição de sua senha no BESS Pro.
    
    Para redefinir sua senha, clique no link abaixo:
    
    🔗 ${resetUrl}
    
    Este link é válido por 30 minutos.
    
    Se você não solicitou a redefinição, ignore este email.
    ═══════════════════════════════════════════════════════════════════════
    `);
    
    // Envio real via SMTP (Mailpit/Nodemailer)
    if (emailProvider === 'nodemailer') {
      try {
        const transporter = await this.getTransporter();
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@besspro.dev',
          to: user.getEmail().getValue(),
          subject: 'Redefinição de senha - BESS Pro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #3b82f6;">Redefinição de Senha</h1>
              
              <p>Olá <strong>${user.getName().getValue()}</strong>,</p>
              
              <p>Você solicitou a redefinição de sua senha no BESS Pro.</p>
              
              <p>Para redefinir sua senha, clique no botão abaixo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Redefinir Minha Senha
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Este link é válido por 30 minutos.</p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Importante:</strong> Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px;">
                Se você não conseguir clicar no botão, copie e cole o link abaixo no seu navegador:<br>
                <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          `,
        });

        console.log(`✅ Email de redefinição de senha enviado com sucesso para ${user.getEmail().getValue()}`);
      } catch (error) {
        console.error('❌ Erro ao enviar email de redefinição de senha:', error);
        throw error;
      }
    }
  }
}