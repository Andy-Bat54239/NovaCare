using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public class AuditLogsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? userId,
        [FromQuery] string? action,
        [FromQuery] string? module,
        [FromQuery] string? from,
        [FromQuery] string? to)
    {
        // Admins see all; everyone else sees only their own activity.
        var role = int.Parse(User.FindFirst("role")!.Value);
        var currentUserId = int.Parse(User.FindFirst("sub")!.Value);

        var query = db.AuditLogs.Include(l => l.User).AsQueryable();

        if (role != 1) query = query.Where(l => l.UserId == currentUserId);
        if (userId.HasValue) query = query.Where(l => l.UserId == userId);
        if (!string.IsNullOrEmpty(action)) query = query.Where(l => l.Action == action);
        if (!string.IsNullOrEmpty(module)) query = query.Where(l => l.Module == module);
        if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDate))
            query = query.Where(l => l.Timestamp >= fromDate);
        if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDate))
            query = query.Where(l => l.Timestamp <= toDate);

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Take(500)
            .Select(l => new
            {
                l.Id,
                l.UserId,
                UserName = l.User.FirstName + " " + l.User.LastName,
                UserEmail = l.User.Email,
                l.Action,
                l.Module,
                l.Details,
                l.IpAddress,
                l.Timestamp,
            })
            .ToListAsync();

        return Ok(logs);
    }
}
