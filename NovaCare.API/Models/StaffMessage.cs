namespace NovaCare.API.Models;

public class StaffMessage
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;

    // Navigation
    public StaffConversation Conversation { get; set; } = null!;
    public User Sender { get; set; } = null!;
}
