using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/staff-chats")]
[Authorize]
public class StaffChatsController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirst("sub")!.Value);
    private int Role   => int.Parse(User.FindFirst("role")!.Value);

    // GET /api/staff-chats — list all staff conversations for the current user
    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        if (Role == 4) return Forbid();
        var uid = UserId;

        var convs = await db.StaffConversations
            .Where(c => c.User1Id == uid || c.User2Id == uid)
            .OrderByDescending(c => c.LastMessageAt)
            .Select(c => new
            {
                c.Id,
                c.User1Id,
                c.User2Id,
                c.CreatedAt,
                c.LastMessageAt,
                OtherUserId  = c.User1Id == uid ? c.User2Id  : c.User1Id,
                OtherName    = c.User1Id == uid
                    ? c.User2.FirstName + " " + c.User2.LastName
                    : c.User1.FirstName + " " + c.User1.LastName,
                OtherRole    = c.User1Id == uid ? c.User2.Role : c.User1.Role,
                UnreadCount  = c.Messages.Count(m => !m.IsRead && m.SenderId != uid),
                LastMessage  = c.Messages.OrderByDescending(m => m.SentAt).Select(m => m.Content).FirstOrDefault(),
            })
            .ToListAsync();

        return Ok(convs);
    }

    // POST /api/staff-chats — open or create a 1-on-1 with another staff member
    [HttpPost]
    public async Task<IActionResult> GetOrCreate([FromBody] StartStaffChatRequest request)
    {
        if (Role == 4) return Forbid();
        var uid = UserId;

        if (uid == request.OtherUserId)
            return BadRequest(new { message = "Cannot start a conversation with yourself." });

        var other = await db.Users.FindAsync(request.OtherUserId);
        if (other == null || other.Role == 4 || !other.IsActive)
            return BadRequest(new { message = "Staff member not found." });

        int u1 = Math.Min(uid, request.OtherUserId);
        int u2 = Math.Max(uid, request.OtherUserId);

        var existing = await db.StaffConversations
            .FirstOrDefaultAsync(c => c.User1Id == u1 && c.User2Id == u2);

        if (existing != null)
            return Ok(new { id = existing.Id });

        var conv = new StaffConversation
        {
            User1Id       = u1,
            User2Id       = u2,
            CreatedAt     = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
        };
        db.StaffConversations.Add(conv);
        await db.SaveChangesAsync();

        return Ok(new { id = conv.Id });
    }

    // GET /api/staff-chats/{id}/messages
    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        if (Role == 4) return Forbid();
        var uid = UserId;

        var conv = await db.StaffConversations.FindAsync(id);
        if (conv == null) return NotFound();
        if (conv.User1Id != uid && conv.User2Id != uid) return Forbid();

        var messages = await db.StaffMessages
            .Where(m => m.ConversationId == id)
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .OrderBy(m => m.SentAt)
            .Select(m => new
            {
                m.Id,
                m.ConversationId,
                m.SenderId,
                m.SenderName,
                m.Content,
                SentAt  = m.SentAt.ToString("O"),
                m.IsRead,
            })
            .ToListAsync();

        // Mark received messages as read
        var unread = await db.StaffMessages
            .Where(m => m.ConversationId == id && !m.IsRead && m.SenderId != uid)
            .ToListAsync();
        foreach (var m in unread) m.IsRead = true;
        if (unread.Count > 0) await db.SaveChangesAsync();

        return Ok(messages);
    }

    // GET /api/staff-chats/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        if (Role == 4) return Forbid();
        var uid = UserId;

        var count = await db.StaffMessages
            .Where(m => (m.Conversation.User1Id == uid || m.Conversation.User2Id == uid)
                        && !m.IsRead && m.SenderId != uid)
            .CountAsync();

        return Ok(new { count });
    }

    // GET /api/staff-chats/colleagues — list of other active staff members
    [HttpGet("colleagues")]
    public async Task<IActionResult> GetColleagues()
    {
        if (Role == 4) return Forbid();
        var uid = UserId;

        var bid = int.Parse(User.FindFirst("branchId")?.Value ?? "0");
        var staff = await db.Users
            .Where(u => u.IsActive && u.Role != 4 && u.Id != uid && u.BranchId == bid)
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email,
                u.Role,
                u.BranchId,
                Branch = u.Branch == null ? null : u.Branch.Name,
            })
            .OrderBy(u => u.Role)
            .ThenBy(u => u.FirstName)
            .ToListAsync();

        return Ok(staff);
    }
}

public record StartStaffChatRequest(int OtherUserId);
