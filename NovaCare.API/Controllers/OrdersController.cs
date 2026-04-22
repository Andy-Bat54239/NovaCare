using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;
using NovaCare.API.Services;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController(AppDbContext db, IWebHostEnvironment env, AuditService audit) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = db.Orders.Include(o => o.Items).ThenInclude(i => i.Medicine)
                             .Include(o => o.Branch)
                             .AsQueryable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(o => o.Status == status);
        return Ok(await query.OrderByDescending(o => o.OrderDate).ToListAsync());
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await db.Orders.Include(o => o.Items).ThenInclude(i => i.Medicine)
                                   .Include(o => o.Branch)
                                   .FirstOrDefaultAsync(o => o.Id == id);
        return order is null ? NotFound() : Ok(order);
    }

    // Public: shop customers place orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Order order)
    {
        order.Id = 0;
        order.OrderDate = DateTime.UtcNow;
        order.Status = "Pending";

        // Link to customer account if request is from a logged-in customer (role 4)
        var roleClaim = User.FindFirst("role")?.Value;
        var subClaim = User.FindFirst("sub")?.Value;
        if (roleClaim == "4" && subClaim != null)
            order.CustomerUserId = int.Parse(subClaim);

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    // Customer: get their own orders
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyOrders()
    {
        var roleClaim = User.FindFirst("role")?.Value;
        if (roleClaim != "4") return Forbid();
        var userId = int.Parse(User.FindFirst("sub")!.Value);
        var orders = await db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Medicine)
            .Include(o => o.Branch)
            .Where(o => o.CustomerUserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
        return Ok(orders);
    }

    // Staff: Approve or Reject
    [HttpPatch("{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var order = await db.Orders.FindAsync(id);
        if (order is null) return NotFound();

        order.Status = request.Status;
        if (request.Status == "Approved")
        {
            var userId = int.Parse(User.FindFirst("sub")!.Value);
            order.ApprovedById = userId;
        }

        await db.SaveChangesAsync();
        await audit.LogAsync(request.Status, "Order", $"Order #{order.Id} — {order.CustomerName}");
        return Ok(order);
    }

    // Upload prescription for an order item
    [HttpPost("{orderId}/items/{itemId}/prescription")]
    public async Task<IActionResult> UploadPrescription(int orderId, int itemId, IFormFile file)
    {
        var item = await db.OrderItems.FirstOrDefaultAsync(i => i.Id == itemId && i.OrderId == orderId);
        if (item is null) return NotFound();

        if (file.Length > 5 * 1024 * 1024) return BadRequest("File size must be under 5MB.");
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!allowed.Contains(ext)) return BadRequest("Only JPG, PNG, or PDF files are allowed.");

        var uploadsDir = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "prescriptions");
        Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        item.PrescriptionImagePath = $"/uploads/prescriptions/{fileName}";
        item.PrescriptionFileName = file.FileName;

        var order = await db.Orders.FindAsync(orderId);
        if (order is not null) order.HasPrescription = true;

        await db.SaveChangesAsync();
        return Ok(new { path = item.PrescriptionImagePath });
    }
}

public record UpdateStatusRequest(string Status);
