using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BranchesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await db.Branches.OrderBy(b => b.Name).ToListAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var branch = await db.Branches.FindAsync(id);
        return branch is null ? NotFound() : Ok(branch);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] Branch branch)
    {
        branch.Id = 0;
        db.Branches.Add(branch);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = branch.Id }, branch);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(int id, [FromBody] Branch branch)
    {
        if (id != branch.Id) return BadRequest();
        db.Entry(branch).State = EntityState.Modified;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
