using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;
using NovaCare.API.Services;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController(AppDbContext db, AuditService audit, IEmailService email) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await db.Users.Include(u => u.Branch).Select(u => new {
            u.Id, u.FirstName, u.LastName, u.Email, u.Role, u.BranchId,
            BranchName = u.Branch.Name, u.IsActive, u.CreatedAt
        }).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await db.Users.Include(u => u.Branch).FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();
        return Ok(new { user.Id, user.FirstName, user.LastName, user.Email, user.Role, user.BranchId, user.IsActive });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict(new { message = "Email already exists." });

        // Generate a secure random temporary password — never exposed in the UI, sent only via email.
        var tempPassword = GenerateTempPassword();

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
            MustChangePassword = true,
            Role = request.Role,
            BranchId = request.BranchId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        await audit.LogAsync("Created", "User", $"Created user {user.Email} (role {user.Role})");

        // Send welcome email with temporary password (fire-and-forget; failure is logged but non-fatal)
        _ = email.SendWelcomeEmailAsync(user.Email, user.FirstName, tempPassword);

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new { user.Id, user.FirstName, user.LastName, user.Email, user.Role });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Email = request.Email;
        user.Role = request.Role;
        user.BranchId = request.BranchId;
        user.IsActive = request.IsActive;
        if (!string.IsNullOrEmpty(request.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        await db.SaveChangesAsync();
        await audit.LogAsync("Updated", "User", $"Updated user {user.Email}");
        return NoContent();
    }

    // Admin-only: reset any user's password without needing their current one.
    [HttpPost("{id}/password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        var role = int.Parse(User.FindFirst("role")!.Value);
        if (role != 1) return Forbid();

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = true;
        await db.SaveChangesAsync();
        await audit.LogAsync("PasswordReset", "User", $"Reset password for {user.Email}");

        // Notify the user by email with their new temporary password
        _ = email.SendPasswordResetEmailAsync(user.Email, user.FirstName, request.NewPassword);

        return Ok(new { message = "Password reset." });
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /// Generates a random 12-character alphanumeric temporary password using a GUID.
    /// Example: "A3F9B1C72D4E"
    private static string GenerateTempPassword() =>
        Guid.NewGuid().ToString("N")[..12].ToUpper();

    // ── Permissions ───────────────────────────────────────────────────

    /// Returns the resolved permission list for a user:
    /// custom overrides if stored, otherwise the role defaults.
    [HttpGet("{id}/permissions")]
    public async Task<IActionResult> GetPermissions(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        return Ok(PermissionHelper.Resolve(user));
    }

    /// Saves a custom permission set for a user (admin only).
    /// Pass an empty array to restore role defaults.
    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> SetPermissions(int id, [FromBody] string[] permissionNames)
    {
        var callerRole = int.Parse(User.FindFirst("role")!.Value);
        if (callerRole != 1) return Forbid();

        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        // Store null when the caller sends exactly the role defaults (treat as "no override")
        var defaults = PermissionHelper.RoleDefaults(user.Role);
        bool isDefault = permissionNames.Length == defaults.Length
                         && permissionNames.OrderBy(x => x).SequenceEqual(defaults.OrderBy(x => x));

        user.Permissions = isDefault ? null : JsonSerializer.Serialize(permissionNames);
        await db.SaveChangesAsync();
        await audit.LogAsync("PermissionsUpdated", "User", $"Updated permissions for {user.Email}");

        return Ok(PermissionHelper.Resolve(user));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        var email = user.Email;
        db.Users.Remove(user);
        await db.SaveChangesAsync();
        await audit.LogAsync("Deleted", "User", $"Deleted user {email}");
        return NoContent();
    }

    // Update the signed-in user's own profile (name only — email/role/branch stay admin-controlled).
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirst("sub")!.Value);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        await db.SaveChangesAsync();
        await audit.LogAsync("Updated", "Profile", "Updated own profile");

        return Ok(new { user.Id, user.FirstName, user.LastName, user.Email, user.Role, user.BranchId });
    }

    [HttpPost("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = int.Parse(User.FindFirst("sub")!.Value);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        await db.SaveChangesAsync();
        await audit.LogAsync("PasswordChanged", "Profile", "Changed own password");

        return Ok(new { message = "Password updated." });
    }

    // Called on first login (default password flow) — no current password required.
    // Only succeeds when MustChangePassword is true for the signed-in user.
    [HttpPost("me/force-password")]
    public async Task<IActionResult> ForceChangePassword([FromBody] ForcePasswordRequest request)
    {
        var userId = int.Parse(User.FindFirst("sub")!.Value);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        if (!user.MustChangePassword)
            return BadRequest(new { message = "No forced password change is required for this account." });

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        await db.SaveChangesAsync();
        await audit.LogAsync("PasswordChanged", "Profile", "Set password on first login");

        return Ok(new { message = "Password set successfully." });
    }
}

public record CreateUserRequest(string FirstName, string LastName, string Email, int Role, int? BranchId);
public record UpdateUserRequest(string FirstName, string LastName, string Email, string? Password, int Role, int? BranchId, bool IsActive);
public record UpdateProfileRequest(string FirstName, string LastName);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record ResetPasswordRequest(string NewPassword);
public record ForcePasswordRequest(string NewPassword);

/// <summary>
/// Resolves a user's effective permission list and exposes role defaults.
/// Used by UsersController (permission endpoints) and AuthController (login response).
/// </summary>
public static class PermissionHelper
{
    private static readonly string[] All =
    [
        "ViewDashboard","ViewMedicines","CreateMedicines","EditMedicines","DeleteMedicines",
        "ViewBatches","CreateBatches",
        "ViewSales","CreateSales",
        "ViewCustomers","CreateCustomers","EditCustomers",
        "ViewOrders","ApproveOrders",
        "ViewReports","ExportReports",
        "ViewUsers","CreateUsers","EditUsers",
        "ViewContactMessages","ReplyContactMessages",
        "ManagePermissions","ViewAuditLog","ManageSettings",
    ];

    private static readonly string[] ManagerDefaults =
    [
        "ViewDashboard","ViewMedicines","CreateMedicines","EditMedicines",
        "ViewBatches","CreateBatches",
        "ViewSales","CreateSales",
        "ViewCustomers","CreateCustomers","EditCustomers",
        "ViewOrders","ApproveOrders",
        "ViewReports",
        "ViewContactMessages","ReplyContactMessages",
    ];

    private static readonly string[] PharmacistDefaults =
    [
        "ViewDashboard","ViewMedicines","ViewBatches",
        "ViewSales","CreateSales",
        "ViewCustomers","CreateCustomers",
        "ViewOrders",
    ];

    public static string[] RoleDefaults(int role) => role switch
    {
        1 => All,
        2 => ManagerDefaults,
        3 => PharmacistDefaults,
        _ => [],
    };

    /// <summary>Returns stored custom permissions if set, otherwise the role defaults.</summary>
    public static string[] Resolve(User user)
    {
        if (!string.IsNullOrEmpty(user.Permissions))
        {
            var custom = JsonSerializer.Deserialize<string[]>(user.Permissions);
            if (custom is { Length: > 0 }) return custom;
        }
        return RoleDefaults(user.Role);
    }
}
