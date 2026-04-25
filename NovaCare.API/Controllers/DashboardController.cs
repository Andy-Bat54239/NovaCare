using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var role = int.Parse(User.FindFirst("role")!.Value);
        var branchId = int.Parse(User.FindFirst("branchId")!.Value);
        var userId = int.Parse(User.FindFirst("sub")!.Value);
        var today = DateTime.UtcNow.Date;
        var ninetyDays = today.AddDays(90);

        if (role == 1) // Admin — system-wide
        {
            var totalRevenue = await db.Sales.SumAsync(s => s.TotalAmount);
            var totalMedicines = await db.Medicines.CountAsync();
            var activeUsers = await db.Users.CountAsync(u => u.IsActive);
            var pendingOrders = await db.Orders.CountAsync(o => o.Status == "Pending");
            var lowStock = await db.Batches.CountAsync(b => b.RemainingQuantity < 10 && b.RemainingQuantity > 0);
            var unreadMessages = await db.ContactMessages.CountAsync(m => m.Status == "Unread");
            var expiringSoon = await db.Batches.CountAsync(b => b.ExpiryDate > today && b.ExpiryDate <= ninetyDays && b.RemainingQuantity > 0);

            return Ok(new { role, totalRevenue, totalMedicines, activeUsers, pendingOrders, lowStock, unreadMessages, expiringSoon });
        }

        if (role == 2) // Manager — branch-level
        {
            var branchRevenue = await db.Sales.Where(s => s.BranchId == branchId).SumAsync(s => s.TotalAmount);
            var branchSales = await db.Sales.CountAsync(s => s.BranchId == branchId);
            var branchOrders = await db.Orders.CountAsync(o => o.BranchId == branchId && o.Status == "Pending");
            var branchStaff = await db.Users.CountAsync(u => u.BranchId == branchId && u.IsActive);
            var lowStock = await db.Batches.CountAsync(b => b.BranchId == branchId && b.RemainingQuantity < 10 && b.RemainingQuantity > 0);
            var expiringSoon = await db.Batches.CountAsync(b => b.BranchId == branchId && b.ExpiryDate > today && b.ExpiryDate <= ninetyDays && b.RemainingQuantity > 0);

            return Ok(new { role, branchRevenue, branchSales, branchOrders, branchStaff, lowStock, expiringSoon });
        }

        // Pharmacist — personal
        var myTodaySales = await db.Sales.Where(s => s.UserId == userId && s.SaleDate >= today).CountAsync();
        var myTodayRevenue = await db.Sales.Where(s => s.UserId == userId && s.SaleDate >= today).SumAsync(s => s.TotalAmount);
        var myTotalSales = await db.Sales.CountAsync(s => s.UserId == userId);
        var myTotalRevenue = await db.Sales.Where(s => s.UserId == userId).SumAsync(s => s.TotalAmount);
        var pendingOrdersPharm = await db.Orders.CountAsync(o => o.BranchId == branchId && o.Status == "Pending");

        return Ok(new { role, myTodaySales, myTodayRevenue, myTotalSales, myTotalRevenue, pendingOrders = pendingOrdersPharm });
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var role = int.Parse(User.FindFirst("role")!.Value);
        var branchId = int.Parse(User.FindFirst("branchId")!.Value);
        var today = DateTime.UtcNow.Date;
        var ninetyDays = today.AddDays(90);
        var isAdmin = role == 1;

        var items = new List<object>();

        // Pending orders (admins see all, others see their branch)
        var pendingOrdersQuery = db.Orders.Where(o => o.Status == "Pending");
        if (!isAdmin) pendingOrdersQuery = pendingOrdersQuery.Where(o => o.BranchId == branchId);
        var pendingOrders = await pendingOrdersQuery
            .OrderByDescending(o => o.OrderDate)
            .Take(5)
            .Select(o => new { o.Id, o.CustomerName, o.TotalAmount, o.OrderDate })
            .ToListAsync();
        foreach (var o in pendingOrders)
        {
            items.Add(new
            {
                id = $"order:{o.Id}",
                type = "pending_order",
                severity = "warning",
                title = $"Pending order from {o.CustomerName}",
                description = $"RWF {o.TotalAmount:N0} awaiting approval",
                timestamp = o.OrderDate,
                link = "/dashboard/orders",
            });
        }

        // Unread contact messages (admins only — ContactMessages aren't branch-scoped the same way)
        if (isAdmin)
        {
            var unread = await db.ContactMessages
                .Where(m => m.Status == "Unread")
                .OrderByDescending(m => m.CreatedAt)
                .Take(5)
                .Select(m => new { m.Id, m.Name, m.Subject, m.CreatedAt })
                .ToListAsync();
            foreach (var m in unread)
            {
                items.Add(new
                {
                    id = $"msg:{m.Id}",
                    type = "unread_message",
                    severity = "info",
                    title = $"New message from {m.Name}",
                    description = string.IsNullOrWhiteSpace(m.Subject) ? "(No subject)" : m.Subject,
                    timestamp = m.CreatedAt,
                    link = "/dashboard/contact-messages",
                });
            }
        }

        // Low stock batches
        var lowStockQuery = db.Batches.Include(b => b.Medicine).Include(b => b.Branch)
            .Where(b => b.RemainingQuantity > 0 && b.RemainingQuantity < 10);
        if (!isAdmin) lowStockQuery = lowStockQuery.Where(b => b.BranchId == branchId);
        var lowStock = await lowStockQuery
            .OrderBy(b => b.RemainingQuantity)
            .Take(5)
            .Select(b => new { b.Id, Medicine = b.Medicine.BrandName, Branch = b.Branch.Name, b.RemainingQuantity, b.BatchNumber })
            .ToListAsync();
        foreach (var b in lowStock)
        {
            items.Add(new
            {
                id = $"lowstock:{b.Id}",
                type = "low_stock",
                severity = "danger",
                title = $"Low stock: {b.Medicine}",
                description = $"{b.RemainingQuantity} units left at {b.Branch} ({b.BatchNumber})",
                timestamp = (DateTime?)null,
                link = "/dashboard/batches",
            });
        }

        // Expiring soon
        var expiringQuery = db.Batches.Include(b => b.Medicine).Include(b => b.Branch)
            .Where(b => b.RemainingQuantity > 0 && b.ExpiryDate > today && b.ExpiryDate <= ninetyDays);
        if (!isAdmin) expiringQuery = expiringQuery.Where(b => b.BranchId == branchId);
        var expiring = await expiringQuery
            .OrderBy(b => b.ExpiryDate)
            .Take(5)
            .Select(b => new { b.Id, Medicine = b.Medicine.BrandName, Branch = b.Branch.Name, b.ExpiryDate, b.BatchNumber })
            .ToListAsync();
        foreach (var b in expiring)
        {
            var days = (int)(b.ExpiryDate - today).TotalDays;
            items.Add(new
            {
                id = $"expiring:{b.Id}",
                type = "expiring",
                severity = "warning",
                title = $"Expiring soon: {b.Medicine}",
                description = $"Expires in {days} days ({b.Branch} · {b.BatchNumber})",
                timestamp = (DateTime?)b.ExpiryDate,
                link = "/dashboard/batches",
            });
        }

        return Ok(items);
    }

    [HttpGet("sales-chart")]
    public async Task<IActionResult> GetSalesChart([FromQuery] int days = 7)
    {
        var branchId = int.Parse(User.FindFirst("branchId")!.Value);
        var role     = int.Parse(User.FindFirst("role")!.Value);
        var from     = DateTime.UtcNow.Date.AddDays(-(days - 1));

        var salesQuery = db.Sales.Where(s => s.SaleDate >= from);
        if (role != 1) salesQuery = salesQuery.Where(s => s.BranchId == branchId);

        var salesData = await salesQuery
            .GroupBy(s => s.SaleDate.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(s => s.TotalAmount), Count = g.Count() })
            .ToListAsync();

        var ordersQuery = db.Orders.Where(o => o.OrderDate >= from && o.Status == "Approved");
        if (role != 1) ordersQuery = ordersQuery.Where(o => o.BranchId == branchId);

        var ordersData = await ordersQuery
            .GroupBy(o => o.OrderDate.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(o => o.TotalAmount), Count = g.Count() })
            .ToListAsync();

        // Build one entry per day so the chart has no gaps
        var result = Enumerable.Range(0, days)
            .Select(i => from.AddDays(i))
            .Select(date => new
            {
                Date          = date,
                SalesRevenue  = salesData .FirstOrDefault(s => s.Date == date)?.Revenue ?? 0,
                OrdersRevenue = ordersData.FirstOrDefault(o => o.Date == date)?.Revenue ?? 0,
                Revenue       = (salesData .FirstOrDefault(s => s.Date == date)?.Revenue ?? 0)
                              + (ordersData.FirstOrDefault(o => o.Date == date)?.Revenue ?? 0),
                Count         = (salesData .FirstOrDefault(s => s.Date == date)?.Count   ?? 0)
                              + (ordersData.FirstOrDefault(o => o.Date == date)?.Count   ?? 0),
            })
            .OrderBy(x => x.Date);

        return Ok(result);
    }
}
