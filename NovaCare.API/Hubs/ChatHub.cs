using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Hubs;

[Authorize]
public class ChatHub(AppDbContext db) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User!.FindFirst("sub")?.Value;
        var roleStr = Context.User.FindFirst("role")?.Value;
        if (userId == null || roleStr == null) return;

        int role = int.Parse(roleStr);
        var branchIdStr = Context.User.FindFirst("branchId")?.Value;

        // Every user joins their own personal group
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

        // Staff also join their branch-scoped role group so they receive customer messages
        if (role != 4 && branchIdStr != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"role-{role}-branch-{branchIdStr}");

        await base.OnConnectedAsync();
    }

    // ── Customer ↔ Staff messaging ─────────────────────────────────────────

    public async Task SendMessage(int conversationId, string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return;

        var userId = int.Parse(Context.User!.FindFirst("sub")!.Value);
        var role = int.Parse(Context.User.FindFirst("role")!.Value);

        var branchId = int.Parse(Context.User.FindFirst("branchId")?.Value ?? "0");

        var conversation = await db.ChatConversations
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null) return;

        // Access check: only the conversation's customer or staff of the target role AND branch
        if (role == 4 && conversation.CustomerUserId != userId) return;
        if (role != 4 && (role != conversation.TargetRole || branchId != conversation.BranchId)) return;

        var sender = await db.Users.FindAsync(userId);
        if (sender == null) return;

        var message = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId       = userId,
            SenderName     = $"{sender.FirstName} {sender.LastName}",
            Content        = content.Trim(),
            SentAt         = DateTime.UtcNow,
        };

        db.ChatMessages.Add(message);
        conversation.LastMessageAt = message.SentAt;
        await db.SaveChangesAsync();

        var payload = new
        {
            message.Id,
            message.ConversationId,
            message.SenderId,
            message.SenderName,
            message.Content,
            SentAt         = message.SentAt.ToString("O"),
            message.IsRead,
            IsFromCustomer = role == 4,
        };

        // Send to the customer in this conversation
        await Clients.Group($"user-{conversation.CustomerUserId}").SendAsync("ReceiveMessage", payload);
        // Send to all staff of the target role in the correct branch
        await Clients.Group($"role-{conversation.TargetRole}-branch-{conversation.BranchId}").SendAsync("ReceiveMessage", payload);
    }

    // Staff initiates a conversation with a customer (branch derived from staff JWT)
    public async Task StartConversation(int customerUserId, int targetRole)
    {
        var role     = int.Parse(Context.User!.FindFirst("role")!.Value);
        var branchId = int.Parse(Context.User.FindFirst("branchId")?.Value ?? "0");
        if (role == 4) return;

        var customer = await db.Users.FindAsync(customerUserId);
        if (customer == null || customer.Role != 4) return;

        var existing = await db.ChatConversations
            .FirstOrDefaultAsync(c =>
                c.CustomerUserId == customerUserId &&
                c.TargetRole == targetRole &&
                c.BranchId == branchId);

        if (existing != null)
        {
            await Clients.Caller.SendAsync("ConversationStarted", existing.Id);
            return;
        }

        var conversation = new ChatConversation
        {
            CustomerUserId = customerUserId,
            TargetRole     = targetRole,
            BranchId       = branchId,
            CreatedAt      = DateTime.UtcNow,
            LastMessageAt  = DateTime.UtcNow,
        };

        db.ChatConversations.Add(conversation);
        await db.SaveChangesAsync();

        await Clients.Group($"user-{customerUserId}").SendAsync("NewConversation", new
        {
            conversation.Id,
            conversation.CustomerUserId,
            conversation.TargetRole,
            conversation.BranchId,
            CreatedAt     = conversation.CreatedAt.ToString("O"),
            LastMessageAt = conversation.LastMessageAt.ToString("O"),
            CustomerName  = $"{customer.FirstName} {customer.LastName}",
        });

        await Clients.Caller.SendAsync("ConversationStarted", conversation.Id);
    }

    public async Task MarkRead(int conversationId)
    {
        var userId   = int.Parse(Context.User!.FindFirst("sub")!.Value);
        var role     = int.Parse(Context.User.FindFirst("role")!.Value);
        var branchId = int.Parse(Context.User.FindFirst("branchId")?.Value ?? "0");

        var conversation = await db.ChatConversations.FindAsync(conversationId);
        if (conversation == null) return;
        if (role == 4 && conversation.CustomerUserId != userId) return;
        if (role != 4 && (role != conversation.TargetRole || branchId != conversation.BranchId)) return;

        var unread = await db.ChatMessages
            .Where(m => m.ConversationId == conversationId && !m.IsRead && m.SenderId != userId)
            .ToListAsync();

        foreach (var m in unread) m.IsRead = true;
        await db.SaveChangesAsync();
    }

    // ── Staff ↔ Staff direct messaging ────────────────────────────────────

    public async Task SendStaffMessage(int conversationId, string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return;

        var userId = int.Parse(Context.User!.FindFirst("sub")!.Value);
        var role   = int.Parse(Context.User.FindFirst("role")!.Value);

        if (role == 4) return; // customers can't use staff chat

        var conv = await db.StaffConversations.FindAsync(conversationId);
        if (conv == null) return;
        if (conv.User1Id != userId && conv.User2Id != userId) return;

        var sender = await db.Users.FindAsync(userId);
        if (sender == null) return;

        var message = new StaffMessage
        {
            ConversationId = conversationId,
            SenderId       = userId,
            SenderName     = $"{sender.FirstName} {sender.LastName}",
            Content        = content.Trim(),
            SentAt         = DateTime.UtcNow,
        };

        db.StaffMessages.Add(message);
        conv.LastMessageAt = message.SentAt;
        await db.SaveChangesAsync();

        var payload = new
        {
            message.Id,
            message.ConversationId,
            message.SenderId,
            message.SenderName,
            message.Content,
            SentAt   = message.SentAt.ToString("O"),
            message.IsRead,
        };

        int otherId = conv.User1Id == userId ? conv.User2Id : conv.User1Id;

        // Deliver to both participants
        await Clients.Group($"user-{userId}").SendAsync("ReceiveStaffMessage", payload);
        await Clients.Group($"user-{otherId}").SendAsync("ReceiveStaffMessage", payload);
    }

    public async Task MarkStaffRead(int conversationId)
    {
        var userId = int.Parse(Context.User!.FindFirst("sub")!.Value);
        var role   = int.Parse(Context.User.FindFirst("role")!.Value);
        if (role == 4) return;

        var conv = await db.StaffConversations.FindAsync(conversationId);
        if (conv == null) return;
        if (conv.User1Id != userId && conv.User2Id != userId) return;

        var unread = await db.StaffMessages
            .Where(m => m.ConversationId == conversationId && !m.IsRead && m.SenderId != userId)
            .ToListAsync();

        foreach (var m in unread) m.IsRead = true;
        await db.SaveChangesAsync();
    }
}
