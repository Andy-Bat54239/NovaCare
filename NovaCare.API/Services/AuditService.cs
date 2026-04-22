using System.Security.Claims;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Services;

public class AuditService(AppDbContext db, IHttpContextAccessor http)
{
    public async Task LogAsync(string action, string module, string? details = null, int? userIdOverride = null)
    {
        var userId = userIdOverride ?? ResolveUserId();
        if (userId is null) return; // no user context — skip

        var ip = http.HttpContext?.Connection.RemoteIpAddress?.ToString();

        db.AuditLogs.Add(new AuditLog
        {
            UserId    = userId.Value,
            Action    = action,
            Module    = module,
            Details   = details,
            IpAddress = ip,
            Timestamp = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    private int? ResolveUserId()
    {
        var sub = http.HttpContext?.User.FindFirst("sub")?.Value;
        return int.TryParse(sub, out var id) ? id : null;
    }
}
