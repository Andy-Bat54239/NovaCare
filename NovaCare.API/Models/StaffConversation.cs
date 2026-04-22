namespace NovaCare.API.Models;

public class StaffConversation
{
    public int Id { get; set; }
    // User1Id is always the lower user ID to guarantee uniqueness per pair
    public int User1Id { get; set; }
    public int User2Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User1 { get; set; } = null!;
    public User User2 { get; set; } = null!;
    public ICollection<StaffMessage> Messages { get; set; } = [];
}
