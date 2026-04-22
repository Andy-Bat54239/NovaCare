namespace NovaCare.API.Models;

public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int Role { get; set; } // 1=Admin, 2=Manager, 3=Pharmacist, 4=Customer
    public int? BranchId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool MustChangePassword { get; set; } = false;
    // JSON array of permission names. Null = use role defaults.
    public string? Permissions { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // OTP for email verification on customer self-registration
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiry { get; set; }

    // Navigation
    public Branch? Branch { get; set; }
    public ICollection<Sale> Sales { get; set; } = [];
    public ICollection<AuditLog> AuditLogs { get; set; } = [];
}
