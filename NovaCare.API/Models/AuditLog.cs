namespace NovaCare.API.Models;

public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Action { get; set; } = string.Empty;   // e.g. "Created", "Updated", "Deleted"
    public string Module { get; set; } = string.Empty;   // e.g. "Medicine", "Sale", "User"
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}
