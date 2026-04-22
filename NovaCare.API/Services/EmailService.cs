using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace NovaCare.API.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string firstName, string temporaryPassword);
    Task SendPasswordResetEmailAsync(string toEmail, string firstName, string temporaryPassword);
    Task SendOtpEmailAsync(string toEmail, string firstName, string otpCode);
}

public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    private SmtpSettings Settings => config.GetSection("Smtp").Get<SmtpSettings>()
        ?? throw new InvalidOperationException("Smtp configuration is missing.");

    public Task SendWelcomeEmailAsync(string toEmail, string firstName, string temporaryPassword) =>
        SendAsync(
            to: toEmail,
            subject: "Welcome to NovaCare — Your Account Details",
            html: BuildWelcomeHtml(firstName, toEmail, temporaryPassword)
        );

    public Task SendPasswordResetEmailAsync(string toEmail, string firstName, string temporaryPassword) =>
        SendAsync(
            to: toEmail,
            subject: "NovaCare — Your Password Has Been Reset",
            html: BuildResetHtml(firstName, toEmail, temporaryPassword)
        );

    public Task SendOtpEmailAsync(string toEmail, string firstName, string otpCode) =>
        SendAsync(
            to: toEmail,
            subject: "NovaCare — Verify Your Email Address",
            html: BuildOtpHtml(firstName, otpCode)
        );

    private async Task SendAsync(string to, string subject, string html)
    {
        var s = Settings;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(s.FromName, s.FromEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var body = new BodyBuilder { HtmlBody = html };
        message.Body = body.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(s.Host, s.Port, s.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable);
            if (!string.IsNullOrEmpty(s.Username))
                await client.AuthenticateAsync(s.Username, s.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            logger.LogInformation("Email sent to {Email}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            // Log but don't crash — email failure should not block user creation.
            logger.LogError(ex, "Failed to send email to {Email}: {Subject}", to, subject);
        }
    }

    private static string BuildWelcomeHtml(string firstName, string email, string password) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <div style="background:#2d8c7e;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:-0.5px;">NovaCare</h1>
              <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">Pharmacy Management System</p>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;">Hi <strong>{firstName}</strong>,</p>
              <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6;">
                Your NovaCare staff account has been created. Below are your login credentials:
              </p>
              <div style="background:#f8fffe;border:1px solid #c9ece7;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;color:#555;">Email</p>
                <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1a1a1a;">{email}</p>
                <p style="margin:0 0 8px;font-size:13px;color:#555;">Temporary Password</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#2d8c7e;letter-spacing:3px;">{password}</p>
              </div>
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  ⚠️ <strong>Action required:</strong> You will be asked to set a new password the first time you log in. Please do not share this temporary password with anyone.
                </p>
              </div>
              <a href="http://localhost:5173/login"
                 style="display:block;text-align:center;background:#2d8c7e;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;font-size:15px;font-weight:600;">
                Log In to NovaCare →
              </a>
            </div>
            <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">This is an automated message from NovaCare. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        """;

    private static string BuildResetHtml(string firstName, string email, string newPassword) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <div style="background:#2d8c7e;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:-0.5px;">NovaCare</h1>
              <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">Pharmacy Management System</p>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;">Hi <strong>{firstName}</strong>,</p>
              <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6;">
                An administrator has reset your NovaCare password. Your new temporary credentials are:
              </p>
              <div style="background:#f8fffe;border:1px solid #c9ece7;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:13px;color:#555;">Email</p>
                <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1a1a1a;">{email}</p>
                <p style="margin:0 0 8px;font-size:13px;color:#555;">New Temporary Password</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#2d8c7e;letter-spacing:3px;">{newPassword}</p>
              </div>
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  ⚠️ <strong>Action required:</strong> You will be asked to set a new password the first time you log in. If you did not request this reset, contact your administrator immediately.
                </p>
              </div>
              <a href="http://localhost:5173/login"
                 style="display:block;text-align:center;background:#2d8c7e;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;font-size:15px;font-weight:600;">
                Log In to NovaCare →
              </a>
            </div>
            <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">This is an automated message from NovaCare. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        """;

    private static string BuildOtpHtml(string firstName, string otpCode) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <div style="background:#2d8c7e;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:-0.5px;">NovaCare</h1>
              <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">Pharmacy Management System</p>
            </div>
            <div style="padding:32px;">
              <p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;">Hi <strong>{firstName}</strong>,</p>
              <p style="margin:0 0 20px;color:#444;font-size:14px;line-height:1.6;">
                Thank you for registering with NovaCare. Use the verification code below to complete your account setup:
              </p>
              <div style="background:#f8fffe;border:1px solid #c9ece7;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
                <p style="margin:0 0 8px;font-size:13px;color:#555;">Your verification code</p>
                <p style="margin:0;font-size:36px;font-weight:700;color:#2d8c7e;letter-spacing:8px;">{otpCode}</p>
              </div>
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                  ⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                </p>
              </div>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
                If you did not create a NovaCare account, you can safely ignore this email.
              </p>
            </div>
            <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;">This is an automated message from NovaCare. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
        """;
}

public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = false;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "NovaCare";
}
