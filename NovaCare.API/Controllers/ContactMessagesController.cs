using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactMessagesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll([FromQuery] string? status) =>
        Ok(await db.ContactMessages
            .Include(m => m.Branch)
            .Where(m => status == null || m.Status == status)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync());

    [HttpGet("unread-count")]
    [Authorize]
    public async Task<IActionResult> UnreadCount() =>
        Ok(new { count = await db.ContactMessages.CountAsync(m => m.Status == "Unread") });

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContactMessage message)
    {
        message.Id = 0;
        message.Status = "Unread";
        message.CreatedAt = DateTime.UtcNow;
        db.ContactMessages.Add(message);
        await db.SaveChangesAsync();
        return Ok(new { message = "Message sent successfully." });
    }

    [HttpPatch("{id}/read")]
    [Authorize]
    public async Task<IActionResult> ToggleRead(int id)
    {
        var msg = await db.ContactMessages.FindAsync(id);
        if (msg is null) return NotFound();
        msg.Status = msg.Status == "Unread" ? "Read" : "Unread";
        await db.SaveChangesAsync();
        return Ok(msg);
    }

    [HttpPatch("{id}/reply")]
    [Authorize]
    public async Task<IActionResult> Reply(int id, [FromBody] ReplyRequest request)
    {
        var msg = await db.ContactMessages.FindAsync(id);
        if (msg is null) return NotFound();
        msg.ReplyText = request.ReplyText;
        msg.Status = "Replied";
        msg.RepliedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(msg);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var msg = await db.ContactMessages.FindAsync(id);
        if (msg is null) return NotFound();
        db.ContactMessages.Remove(msg);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record ReplyRequest(string ReplyText);
