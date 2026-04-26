using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;
using NovaCare.API.Services;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MedicinesController(AppDbContext db, AuditService audit, ICloudinaryService cloudinary) : ControllerBase
{
    [HttpPost("upload-image")]
    [Authorize]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        if (file is null || file.Length == 0) return BadRequest(new { message = "No file uploaded." });
        if (file.Length > 5 * 1024 * 1024) return BadRequest(new { message = "File size must be under 5MB." });

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (!allowed.Contains(ext)) return BadRequest(new { message = "Only JPG, PNG, or WEBP files are allowed." });

        var path = await cloudinary.UploadAsync(file, "medicines");
        return Ok(new { path });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? search)
    {
        var query = db.Medicines.AsQueryable();
        if (!string.IsNullOrEmpty(category)) query = query.Where(m => m.Category == category);
        if (!string.IsNullOrEmpty(search)) query = query.Where(m => m.BrandName.Contains(search) || m.GenericName.Contains(search));
        return Ok(await query.OrderBy(m => m.BrandName).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var med = await db.Medicines.FindAsync(id);
        return med is null ? NotFound() : Ok(med);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Medicine medicine)
    {
        medicine.Id = 0;
        db.Medicines.Add(medicine);
        await db.SaveChangesAsync();
        await audit.LogAsync("Created", "Medicine", $"Added medicine {medicine.BrandName} ({medicine.GenericName})");
        return CreatedAtAction(nameof(GetById), new { id = medicine.Id }, medicine);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] Medicine medicine)
    {
        if (id != medicine.Id) return BadRequest();
        db.Entry(medicine).State = EntityState.Modified;
        await db.SaveChangesAsync();
        await audit.LogAsync("Updated", "Medicine", $"Updated medicine {medicine.BrandName}");
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var med = await db.Medicines.FindAsync(id);
        if (med is null) return NotFound();
        db.Medicines.Remove(med);
        await db.SaveChangesAsync();
        await audit.LogAsync("Deleted", "Medicine", $"Deleted medicine {med.BrandName}");
        return NoContent();
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var cats = await db.Medicines.Select(m => m.Category).Distinct().OrderBy(c => c).ToListAsync();
        return Ok(cats);
    }

    // Returns medicines with batch stock quantities per branch (requires auth)
    [HttpGet("stock")]
    [Authorize]
    public async Task<IActionResult> GetStock()
    {
        var stock = await db.Medicines
            .OrderBy(m => m.BrandName)
            .Select(m => new
            {
                m.Id,
                m.GenericName,
                m.BrandName,
                m.Strength,
                m.Form,
                m.Category,
                m.RequiresPrescription,
                m.Price,
                m.ImagePath,
                StockByBranch = db.Batches
                    .Where(b => b.MedicineId == m.Id && b.ExpiryDate > DateTime.UtcNow)
                    .GroupBy(b => b.BranchId)
                    .Select(g => new
                    {
                        BranchId = g.Key,
                        TotalStock = g.Sum(b => b.RemainingQuantity),
                    })
                    .ToList(),
                TotalStock = db.Batches
                    .Where(b => b.MedicineId == m.Id && b.ExpiryDate > DateTime.UtcNow)
                    .Sum(b => (int?)b.RemainingQuantity) ?? 0,
            })
            .ToListAsync();

        return Ok(stock);
    }
}
