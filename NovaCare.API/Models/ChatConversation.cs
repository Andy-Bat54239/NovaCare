namespace NovaCare.API.Models;

public class ChatConversation
{
    public int Id { get; set; }
    public int CustomerUserId { get; set; }
    public int TargetRole { get; set; }  // 1=Admin, 2=Manager, 3=Pharmacist
    public int BranchId { get; set; }    // which branch the customer is talking to
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User CustomerUser { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
    public ICollection<ChatMessage> Messages { get; set; } = [];
}
