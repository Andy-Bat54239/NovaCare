using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.DTOs;
using NovaCare.API.Helpers;
using NovaCare.API.Models;
using NovaCare.API.Services;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, JwtHelper jwt, AuditService audit, IEmailService email) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var token = jwt.GenerateToken(user);
        await audit.LogAsync("Login", "Auth", $"User {user.Email} logged in", userIdOverride: user.Id);

        return Ok(new LoginResponse(
            token, user.Id, user.FirstName, user.LastName,
            user.Email, user.Role, user.BranchId,
            user.MustChangePassword, PermissionHelper.Resolve(user)
        ));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
            return BadRequest(new { message = "An account with this email already exists." });

        var otpCode = Random.Shared.Next(100000, 999999).ToString();

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = 4,  // Customer
            BranchId = null,
            IsActive = false,   // Inactive until OTP is verified
            MustChangePassword = false,
            OtpCode = otpCode,
            OtpExpiry = DateTime.UtcNow.AddMinutes(10),
            CreatedAt = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Send OTP email (non-blocking — failure logged but doesn't block response)
        await email.SendOtpEmailAsync(user.Email, user.FirstName, otpCode);

        await audit.LogAsync("Register", "Auth", $"Customer registered (pending OTP): {user.Email}", userIdOverride: user.Id);

        return Ok(new RegisterResponse(
            user.Email,
            "Account created! Please check your email for a 6-digit verification code."
        ));
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user is null)
            return BadRequest(new { message = "Account not found." });

        if (user.IsActive)
            return BadRequest(new { message = "Account is already verified. Please sign in." });

        if (user.OtpCode is null || user.OtpExpiry is null)
            return BadRequest(new { message = "No verification code found. Please request a new one." });

        if (user.OtpCode != request.OtpCode)
            return BadRequest(new { message = "Invalid verification code." });

        if (user.OtpExpiry < DateTime.UtcNow)
            return BadRequest(new { message = "Verification code has expired. Please request a new one." });

        // Activate and clear OTP
        user.IsActive = true;
        user.OtpCode = null;
        user.OtpExpiry = null;

        // Add to Customers table if not already present (so they appear in the staff Customers tab)
        var exists = await db.Customers.AnyAsync(c => c.Email.ToLower() == user.Email.ToLower());
        if (!exists)
        {
            db.Customers.Add(new Customer
            {
                Name = $"{user.FirstName} {user.LastName}",
                Email = user.Email,
                Phone = string.Empty,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await db.SaveChangesAsync();

        await audit.LogAsync("VerifyOtp", "Auth", $"Customer verified email: {user.Email}", userIdOverride: user.Id);

        return Ok(new { message = "Email verified successfully! You can now sign in." });
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user is null)
            return BadRequest(new { message = "Account not found." });

        if (user.IsActive)
            return BadRequest(new { message = "Account is already verified." });

        var otpCode = Random.Shared.Next(100000, 999999).ToString();
        user.OtpCode = otpCode;
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
        await db.SaveChangesAsync();

        await email.SendOtpEmailAsync(user.Email, user.FirstName, otpCode);

        return Ok(new { message = "A new verification code has been sent to your email." });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await audit.LogAsync("Logout", "Auth");
        return Ok(new { message = "Logged out successfully." });
    }
}
