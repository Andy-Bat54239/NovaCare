using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BatchesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? medicineId, [FromQuery] int? branchId)
    {
        var query = db.Batches.Include(b => b.Medicine).Include(b => b.Branch).AsQueryable();
        if (medicineId.HasValue) query = query.Where(b => b.MedicineId == medicineId);
        if (branchId.HasValue) query = query.Where(b => b.BranchId == branchId);
        return Ok(await query.OrderBy(b => b.ExpiryDate).ToListAsync());
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetById(int id)
    {
        var batch = await db.Batches.Include(b => b.Medicine).FirstOrDefaultAsync(b => b.Id == id);
        return batch is null ? NotFound() : Ok(batch);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Batch batch)
    {
        batch.Id = 0;
        batch.CreatedAt = DateTime.UtcNow;

        // Auto-generate a unique batch number — never trust the client-supplied value.
        // Format: BCH-{YYYYMM}-{6 random uppercase chars}
        // e.g. BCH-202604-A3F9B1
        // Retry in the extremely unlikely event of a collision.
        string batchNumber;
        do
        {
            batchNumber = $"BCH-{DateTime.UtcNow:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        }
        while (await db.Batches.AnyAsync(b => b.BatchNumber == batchNumber));

        batch.BatchNumber = batchNumber;

        db.Batches.Add(batch);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = batch.Id }, batch);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] Batch batch)
    {
        if (id != batch.Id) return BadRequest();
        db.Entry(batch).State = EntityState.Modified;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var batch = await db.Batches.FindAsync(id);
        if (batch is null) return NotFound();
        db.Batches.Remove(batch);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
