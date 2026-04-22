namespace NovaCare.API.Models;

public class Branch
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<User> Users { get; set; } = [];
    public ICollection<Sale> Sales { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<ContactMessage> ContactMessages { get; set; } = [];
    public ICollection<ChatConversation> ChatConversations { get; set; } = [];
}
