using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NovaCare.API.Data;
using NovaCare.API.Models;

namespace NovaCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var walkins = await db.Customers
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Email,
                c.Phone,
                c.Address,
                c.CreatedAt,
                IsPortalOnly = false,
            })
            .ToListAsync();

        var walkinEmails = walkins.Select(c => c.Email.ToLower()).ToHashSet();

        var portalOnly = await db.Users
            .Where(u => u.Role == 4 && u.IsActive && !db.Customers.Any(c => c.Email.ToLower() == u.Email.ToLower()))
            .Select(u => new
            {
                Id = 0,
                Name = u.FirstName + " " + u.LastName,
                u.Email,
                Phone = string.Empty,
                Address = (string?)null,
                u.CreatedAt,
                IsPortalOnly = true,
            })
            .ToListAsync();

        var combined = walkins.Concat(portalOnly)
            .Where(c => string.IsNullOrEmpty(search) ||
                c.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                c.Email.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                c.Phone.Contains(search, StringComparison.OrdinalIgnoreCase))
            .OrderBy(c => c.Name);

        return Ok(combined);
    }

    // GET /api/customers/me — customer fetches their own record
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = int.Parse(User.FindFirst("sub")!.Value);
        var userRecord = await db.Users.FindAsync(userId);
        if (userRecord is null) return Unauthorized();
        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Email.ToLower() == userRecord.Email.ToLower());
        return Ok(customer); // null is fine — frontend treats it as "no record yet"
    }

    // PUT /api/customers/me — customer creates or updates their own record
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] CustomerProfileRequest request)
    {
        var userId = int.Parse(User.FindFirst("sub")!.Value);
        var userRecord = await db.Users.FindAsync(userId);
        if (userRecord is null) return Unauthorized();

        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Email.ToLower() == userRecord.Email.ToLower());
        if (customer is null)
        {
            customer = new Customer
            {
                Name      = $"{userRecord.FirstName} {userRecord.LastName}",
                Email     = userRecord.Email,
                Phone     = request.Phone ?? string.Empty,
                Address   = request.Address,
                CreatedAt = DateTime.UtcNow,
            };
            db.Customers.Add(customer);
        }
        else
        {
            customer.Name    = $"{userRecord.FirstName} {userRecord.LastName}";
            customer.Phone   = request.Phone ?? string.Empty;
            customer.Address = request.Address;
        }

        await db.SaveChangesAsync();
        return Ok(customer);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await db.Customers.FindAsync(id);
        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer customer)
    {
        customer.Id = 0;
        customer.CreatedAt = DateTime.UtcNow;
        db.Customers.Add(customer);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Customer customer)
    {
        if (id != customer.Id) return BadRequest();
        db.Entry(customer).State = EntityState.Modified;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await db.Customers.FindAsync(id);
        if (customer is null) return NotFound();
        db.Customers.Remove(customer);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public record CustomerProfileRequest(string? Phone, string? Address);
