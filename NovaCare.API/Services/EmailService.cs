using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace NovaCare.API.Services;

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string toEmail, string firstName, string temporaryPassword);
    Task SendPasswordResetEmailAsync(string toEmail, string firstName, string temporaryPassword);
    Task SendOtpEmailAsync(string toEmail, string firstName, string otpCode);
    Task SendOrderStatusEmailAsync(string toEmail, string customerName, int orderId,
        string status, string branchName, decimal totalAmount,
        IEnumerable<(string MedicineName, int Quantity, decimal UnitPrice)> items,
        string? reason = null);
    Task SendContactReplyEmailAsync(string toEmail, string senderName, string originalSubject,
        string originalMessage, string replyText);
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

    public Task SendOrderStatusEmailAsync(string toEmail, string customerName, int orderId,
        string status, string branchName, decimal totalAmount,
        IEnumerable<(string MedicineName, int Quantity, decimal UnitPrice)> items,
        string? reason = null) =>
        SendAsync(
            to: toEmail,
            subject: status == "Approved"
                ? $"NovaCare — Your Order #{orderId} Has Been Approved"
                : $"NovaCare — Update on Your Order #{orderId}",
            html: BuildOrderStatusHtml(customerName, orderId, status, branchName, totalAmount, items, reason)
        );

    public Task SendContactReplyEmailAsync(string toEmail, string senderName, string originalSubject,
        string originalMessage, string replyText) =>
        SendAsync(
            to: toEmail,
            subject: $"Re: {originalSubject} — NovaCare",
            html: BuildContactReplyHtml(senderName, originalSubject, originalMessage, replyText)
        );

    private static string BuildContactReplyHtml(string name, string subject, string originalMessage, string replyText) => $"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px">
          <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
            <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:28px 32px">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">NovaCare Pharmacy</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Response to your message</p>
            </div>
            <div style="padding:32px">
              <p style="margin:0 0 16px;font-size:15px;color:#374151">Dear <strong>{name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280">
                Thank you for reaching out to us. Here is our response to your message regarding
                <strong>"{subject}"</strong>:
              </p>
              <div style="background:#f0fdfa;border-left:4px solid #0d9488;border-radius:0 8px 8px 0;padding:18px 20px;margin-bottom:28px">
                <p style="margin:0;font-size:15px;color:#0f172a;line-height:1.7">{replyText}</p>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em">Your original message</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;font-style:italic">"{originalMessage}"</p>
              </div>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">
                If you have any further questions, feel free to visit our website or contact us again.
              </p>
              <p style="margin:0;font-size:14px;color:#374151">
                Warm regards,<br/>
                <strong>The NovaCare Pharmacy Team</strong>
              </p>
            </div>
            <div style="padding:16px 32px;background:#f1f5f9;border-top:1px solid #e2e8f0;text-align:center">
              <p style="margin:0;font-size:12px;color:#94a3b8">© 2026 NovaCare Pharmacy. This is a reply to your contact form submission.</p>
            </div>
          </div>
        </div>
        """;

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
            logger.LogInformation("SMTP connecting to {Host}:{Port} UseSsl={UseSsl} From={From}",
                s.Host, s.Port, s.UseSsl, s.FromEmail);

            await client.ConnectAsync(s.Host, s.Port, s.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable);
            if (!string.IsNullOrEmpty(s.Username))
                await client.AuthenticateAsync(s.Username, s.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            logger.LogInformation("Email sent to {Email}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            // Log full details so Railway logs show exactly what failed
            logger.LogError(ex, "SMTP FAILED — Host={Host} Port={Port} UseSsl={UseSsl} To={Email} Subject={Subject} Error={Message}",
                s.Host, s.Port, s.UseSsl, to, subject, ex.Message);
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

    private static string BuildOrderStatusHtml(
        string customerName, int orderId, string status, string branchName,
        decimal totalAmount, IEnumerable<(string MedicineName, int Quantity, decimal UnitPrice)> items,
        string? reason)
    {
        bool approved = status == "Approved";
        string headerColor  = approved ? "#0d9488" : "#ef4444";
        string badgeColor   = approved ? "#f0fdf4" : "#fef2f2";
        string badgeBorder  = approved ? "#bbf7d0" : "#fecaca";
        string badgeText    = approved ? "#15803d"  : "#dc2626";
        string statusLabel  = approved ? "Approved"  : "Rejected";
        string statusIcon   = approved ? "✓" : "✕";

        var itemRows = string.Join("\n", items.Select(i => $"""
            <tr>
              <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;">{i.MedicineName}</td>
              <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:center;">{i.Quantity}</td>
              <td style="padding:8px 12px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;text-align:right;">RWF {i.UnitPrice * i.Quantity:N0}</td>
            </tr>
        """));

        string reasonBlock = (!approved && !string.IsNullOrWhiteSpace(reason)) ? $"""
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
                <strong>Reason:</strong> {reason}
              </p>
            </div>
        """ : "";

        string ctaBlock = approved ? $"""
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
                <strong>Next step:</strong> Please visit <strong>{branchName}</strong> to collect your order.
                Bring a valid ID and, if applicable, your original prescription.
              </p>
            </div>
            <a href="http://localhost:5173/customer/orders"
               style="display:block;text-align:center;background:#0d9488;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:8px;">
              View My Orders →
            </a>
        """ : $"""
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                You can place a new order or contact our pharmacy team via the chat feature in your customer portal for assistance.
              </p>
            </div>
            <a href="http://localhost:5173/customer/orders"
               style="display:block;text-align:center;background:#0d9488;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:8px;">
              View My Orders →
            </a>
        """;

        return $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
              <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

                <div style="background:{headerColor};padding:28px 32px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:-0.5px;">NovaCare</h1>
                  <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:13px;">Pharmacy Management System</p>
                </div>

                <div style="padding:32px;">
                  <p style="margin:0 0 16px;color:#1a1a1a;font-size:15px;">Hi <strong>{customerName}</strong>,</p>

                  <div style="background:{badgeColor};border:1px solid {badgeBorder};border-radius:8px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
                    <span style="font-size:20px;font-weight:700;color:{badgeText};">{statusIcon}</span>
                    <p style="margin:0;font-size:14px;color:{badgeText};line-height:1.5;">
                      Your order <strong>#{orderId}</strong> has been <strong>{statusLabel}</strong>.
                    </p>
                  </div>

                  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;background:#f9fafb;border-radius:8px;overflow:hidden;">
                    <thead>
                      <tr style="background:#f3f4f6;">
                        <th style="padding:10px 12px;font-size:12px;color:#6b7280;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Medicine</th>
                        <th style="padding:10px 12px;font-size:12px;color:#6b7280;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Qty</th>
                        <th style="padding:10px 12px;font-size:12px;color:#6b7280;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemRows}
                    </tbody>
                    <tfoot>
                      <tr style="background:#f3f4f6;">
                        <td colspan="2" style="padding:10px 12px;font-size:13px;font-weight:700;color:#111827;">Total</td>
                        <td style="padding:10px 12px;font-size:14px;font-weight:700;color:{headerColor};text-align:right;">RWF {totalAmount:N0}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">
                    <strong>Branch:</strong> {branchName} &nbsp;·&nbsp;
                    <strong>Order Date:</strong> {DateTime.UtcNow:MMM dd, yyyy}
                  </p>

                  {reasonBlock}
                  {ctaBlock}
                </div>

                <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#999;">This is an automated message from NovaCare. Please do not reply directly to this email.</p>
                </div>
              </div>
            </body>
            </html>
        """;
    }

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
