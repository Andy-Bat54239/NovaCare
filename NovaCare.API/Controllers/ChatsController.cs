using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatsController(AppDbContext db) : ControllerBase
{
    private int UserId   => int.Parse(User.FindFirst("sub")!.Value);
    private int Role     => int.Parse(User.FindFirst("role")!.Value);
    private int BranchId => int.Parse(User.FindFirst("branchId")!.Value);

    // GET /api/chats — list conversations for the current user
    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        var uid = UserId;
        var role = Role;

        if (role == 4)
        {
            // Customer: own conversations across any branch
            var convs = await db.ChatConversations
                .Where(c => c.CustomerUserId == uid)
                .OrderByDescending(c => c.LastMessageAt)
                .Select(c => new
                {
                    c.Id,
                    c.CustomerUserId,
                    c.TargetRole,
                    c.BranchId,
                    BranchName   = c.Branch.Name,
                    BranchAddress = c.Branch.Address,
                    c.CreatedAt,
                    c.LastMessageAt,
                    CustomerName = c.CustomerUser.FirstName + " " + c.CustomerUser.LastName,
                    UnreadCount  = c.Messages.Count(m => !m.IsRead && m.SenderId != uid),
                    LastMessage  = c.Messages.OrderByDescending(m => m.SentAt).Select(m => m.Content).FirstOrDefault(),
                })
                .ToListAsync();
            return Ok(convs);
        }
        else
        {
            // Staff: conversations directed at their role AND their branch
            var bid = BranchId;
            var convs = await db.ChatConversations
                .Where(c => c.TargetRole == role && c.BranchId == bid)
                .OrderByDescending(c => c.LastMessageAt)
                .Select(c => new
                {
                    c.Id,
                    c.CustomerUserId,
                    c.TargetRole,
                    c.BranchId,
                    BranchName    = c.Branch.Name,
                    c.CreatedAt,
                    c.LastMessageAt,
                    CustomerName  = c.CustomerUser.FirstName + " " + c.CustomerUser.LastName,
                    CustomerEmail = c.CustomerUser.Email,
                    UnreadCount   = c.Messages.Count(m => !m.IsRead && m.SenderId != uid),
                    LastMessage   = c.Messages.OrderByDescending(m => m.SentAt).Select(m => m.Content).FirstOrDefault(),
                })
                .ToListAsync();
            return Ok(convs);
        }
    }

    // POST /api/chats — customer creates (or reopens) a conversation with a specific role at a specific branch
    [HttpPost]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request)
    {
        var uid = UserId;
        if (Role != 4) return Forbid();

        if (request.TargetRole < 1 || request.TargetRole > 3)
            return BadRequest(new { message = "Invalid target role." });

        var branch = await db.Branches.FindAsync(request.BranchId);
        if (branch is null || !branch.IsActive)
            return BadRequest(new { message = "Branch not found or inactive." });

        // One conversation per customer per role per branch
        var existing = await db.ChatConversations
            .FirstOrDefaultAsync(c =>
                c.CustomerUserId == uid &&
                c.TargetRole == request.TargetRole &&
                c.BranchId == request.BranchId);

        if (existing != null)
            return Ok(new
            {
                existing.Id,
                existing.CustomerUserId,
                existing.TargetRole,
                existing.BranchId,
                BranchName = branch.Name,
            });

        var conversation = new ChatConversation
        {
            CustomerUserId = uid,
            TargetRole     = request.TargetRole,
            BranchId       = request.BranchId,
            CreatedAt      = DateTime.UtcNow,
            LastMessageAt  = DateTime.UtcNow,
        };

        db.ChatConversations.Add(conversation);
        await db.SaveChangesAsync();

        return Ok(new
        {
            conversation.Id,
            conversation.CustomerUserId,
            conversation.TargetRole,
            conversation.BranchId,
            BranchName = branch.Name,
        });
    }

    // GET /api/chats/{id}/messages
    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var uid  = UserId;
        var role = Role;
        var bid  = BranchId;

        var conversation = await db.ChatConversations.FindAsync(id);
        if (conversation == null) return NotFound();

        // Access: customer owns it, or staff match role AND branch
        if (role == 4 && conversation.CustomerUserId != uid) return Forbid();
        if (role != 4 && (role != conversation.TargetRole || bid != conversation.BranchId)) return Forbid();

        var messages = await db.ChatMessages
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
                SentAt        = m.SentAt.ToString("O"),
                m.IsRead,
                IsFromCustomer = m.Sender.Role == 4,
            })
            .ToListAsync();

        // Mark received messages as read whenever a conversation is opened
        var unread = await db.ChatMessages
            .Where(m => m.ConversationId == id && !m.IsRead && m.SenderId != uid)
            .ToListAsync();
        foreach (var m in unread) m.IsRead = true;
        if (unread.Count > 0) await db.SaveChangesAsync();

        return Ok(messages);
    }

    // GET /api/chats/unread-count — combined customer + staff unread for badge
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var uid  = UserId;
        var role = Role;
        var bid  = BranchId;

        int count;
        if (role == 4)
        {
            count = await db.ChatMessages
                .Where(m => m.Conversation.CustomerUserId == uid && !m.IsRead && m.SenderId != uid)
                .CountAsync();
        }
        else
        {
            var customerUnread = await db.ChatMessages
                .Where(m => m.Conversation.TargetRole == role
                         && m.Conversation.BranchId == bid
                         && !m.IsRead && m.SenderId != uid)
                .CountAsync();

            var staffUnread = await db.StaffMessages
                .Where(m => (m.Conversation.User1Id == uid || m.Conversation.User2Id == uid)
                         && !m.IsRead && m.SenderId != uid)
                .CountAsync();

            count = customerUnread + staffUnread;
        }
        return Ok(new { count });
    }

    // GET /api/chats/customers — staff: list registered customers (for initiating conversations)
    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        if (Role == 4) return Forbid();

        var customers = await db.Users
            .Where(u => u.Role == 4 && u.IsActive)
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.CreatedAt })
            .OrderBy(u => u.FirstName)
            .ToListAsync();
        return Ok(customers);
    }

    // GET /api/chats/branches — customer: list active branches to choose from
    [HttpGet("branches")]
    public async Task<IActionResult> GetBranches()
    {
        var branches = await db.Branches
            .Where(b => b.IsActive)
            .Select(b => new { b.Id, b.Name, b.Address, b.Phone })
            .OrderBy(b => b.Name)
            .ToListAsync();
        return Ok(branches);
    }
}

public record CreateConversationRequest(int TargetRole, int BranchId);
