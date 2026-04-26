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
[Authorize]
public class SalesController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? branchId, [FromQuery] string? from, [FromQuery] string? to)
    {
        var query = db.Sales.AsQueryable();

        if (branchId.HasValue) query = query.Where(s => s.BranchId == branchId);
        if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDate))
            query = query.Where(s => s.SaleDate >= fromDate);
        if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDate))
            query = query.Where(s => s.SaleDate <= toDate);

        var result = await query
            .OrderByDescending(s => s.SaleDate)
            .Select(s => new
            {
                s.Id,
                s.InvoiceNumber,
                s.BranchId,
                BranchName    = s.Branch.Name,
                s.UserId,
                StaffName     = s.User.FirstName + " " + s.User.LastName,
                s.CustomerId,
                CustomerName  = s.Customer == null ? null : s.Customer.Name,
                s.TotalAmount,
                s.PaymentMethod,
                s.PaymentReference,
                s.Notes,
                s.SaleDate,
                Items = s.Items.Select(i => new
                {
                    i.Id,
                    i.MedicineId,
                    Medicine = new { i.Medicine.BrandName, i.Medicine.RequiresPrescription },
                    i.Quantity,
                    i.UnitPrice,
                    i.Subtotal,
                }).ToList(),
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sale = await db.Sales.Include(s => s.Items).ThenInclude(i => i.Medicine)
                                 .Include(s => s.Customer)
                                 .FirstOrDefaultAsync(s => s.Id == id);
        return sale is null ? NotFound() : Ok(sale);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Sale sale)
    {
        sale.Id = 0;
        sale.SaleDate = DateTime.UtcNow;
        sale.InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

        // Auto-deduct stock from batches (FEFO: First Expiry First Out)
        foreach (var item in sale.Items)
        {
            var remaining = item.Quantity;
            var batches = await db.Batches
                .Where(b => b.MedicineId == item.MedicineId && b.BranchId == sale.BranchId && b.RemainingQuantity > 0 && b.ExpiryDate > DateTime.UtcNow)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync();

            foreach (var batch in batches)
            {
                if (remaining <= 0) break;
                var deduct = Math.Min(batch.RemainingQuantity, remaining);
                batch.RemainingQuantity -= deduct;
                remaining -= deduct;
            }

            item.Subtotal = item.Quantity * item.UnitPrice;
        }

        db.Sales.Add(sale);
        await db.SaveChangesAsync();
        await audit.LogAsync("Created", "Sale", $"Invoice {sale.InvoiceNumber} — RWF {sale.TotalAmount:N0}");
        return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
    }
}
