namespace NovaCare.API.Models;

public class ContactMessage
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public int? BranchId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Unread"; // Unread, Read, Replied
    public string? ReplyText { get; set; }
    public DateTime? RepliedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Branch? Branch { get; set; }
}
