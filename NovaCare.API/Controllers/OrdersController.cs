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
public class OrdersController(AppDbContext db, IWebHostEnvironment env, AuditService audit, IEmailService email) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var role     = int.Parse(User.FindFirst("role")!.Value);
        var branchId = int.Parse(User.FindFirst("branchId")!.Value);

        var query = db.Orders.AsQueryable();

        // Admins see all branches; everyone else sees only their branch
        if (role != 1) query = query.Where(o => o.BranchId == branchId);

        if (!string.IsNullOrEmpty(status)) query = query.Where(o => o.Status == status);

        var result = await query
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                o.Id,
                o.CustomerName,
                o.CustomerEmail,
                o.CustomerPhone,
                o.BranchId,
                BranchName    = o.Branch.Name,
                o.Status,
                o.TotalAmount,
                o.OrderDate,
                o.HasPrescription,
                o.CustomerUserId,
                o.ApprovedById,
                ApprovedBy    = o.ApprovedBy == null ? null : o.ApprovedBy.FirstName + " " + o.ApprovedBy.LastName,
                Items = o.Items.Select(i => new
                {
                    i.Id,
                    i.MedicineId,
                    Medicine = new { i.Medicine.BrandName, i.Medicine.RequiresPrescription },
                    i.Quantity,
                    i.UnitPrice,
                    i.PrescriptionImagePath,
                    i.PrescriptionFileName,
                }).ToList(),
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await db.Orders
            .Where(o => o.Id == id)
            .Select(o => new
            {
                o.Id, o.CustomerName, o.CustomerEmail, o.CustomerPhone,
                o.BranchId, BranchName = o.Branch.Name,
                o.Status, o.TotalAmount, o.OrderDate, o.HasPrescription,
                o.CustomerUserId, o.ApprovedById,
                Items = o.Items.Select(i => new
                {
                    i.Id, i.MedicineId,
                    Medicine = new { i.Medicine.BrandName, i.Medicine.RequiresPrescription },
                    i.Quantity, i.UnitPrice,
                    i.PrescriptionImagePath, i.PrescriptionFileName,
                }).ToList(),
            })
            .FirstOrDefaultAsync();
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
            .Where(o => o.CustomerUserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new
            {
                o.Id, o.CustomerName, o.CustomerEmail, o.CustomerPhone,
                o.BranchId, BranchName = o.Branch.Name,
                o.Status, o.TotalAmount, o.OrderDate, o.HasPrescription,
                o.CustomerUserId,
                Items = o.Items.Select(i => new
                {
                    i.Id, i.MedicineId,
                    Medicine = new { i.Medicine.BrandName, i.Medicine.GenericName },
                    i.Quantity, i.UnitPrice,
                    i.PrescriptionImagePath, i.PrescriptionFileName,
                }).ToList(),
            })
            .ToListAsync();
        return Ok(orders);
    }

    // Staff: Approve, Reject, or Complete
    [HttpPatch("{id}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        var role     = int.Parse(User.FindFirst("role")!.Value);
        var branchId = int.Parse(User.FindFirst("branchId")!.Value);

        var order = await db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Medicine)
            .Include(o => o.Branch)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();

        // Non-admins can only update orders for their own branch
        if (role != 1 && order.BranchId != branchId) return Forbid();

        order.Status = request.Status;
        if (request.Status == "Approved")
        {
            var userId = int.Parse(User.FindFirst("sub")!.Value);
            order.ApprovedById = userId;
        }

        await db.SaveChangesAsync();
        await audit.LogAsync(request.Status, "Order", $"Order #{order.Id} — {order.CustomerName}");

        // Send confirmation email to customer when order is approved or rejected
        if (request.Status is "Approved" or "Rejected")
        {
            var itemLines = order.Items.Select(i => (
                MedicineName: i.Medicine?.BrandName ?? $"Medicine #{i.MedicineId}",
                i.Quantity,
                i.UnitPrice
            ));

            await email.SendOrderStatusEmailAsync(
                toEmail:      order.CustomerEmail,
                customerName: order.CustomerName,
                orderId:      order.Id,
                status:       request.Status,
                branchName:   order.Branch?.Name ?? "NovaCare Branch",
                totalAmount:  order.TotalAmount,
                items:        itemLines,
                reason:       request.Reason
            );
        }

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

public record UpdateStatusRequest(string Status, string? Reason = null);
