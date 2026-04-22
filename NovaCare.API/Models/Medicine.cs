namespace NovaCare.API.Models;

public class Medicine
{
    public int Id { get; set; }
    public string GenericName { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public string Strength { get; set; } = string.Empty;
    public string Form { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool RequiresPrescription { get; set; }
    public decimal Price { get; set; }
    public string? ImagePath { get; set; }
    public string? Description { get; set; }

    // Navigation
    public ICollection<Batch> Batches { get; set; } = [];
    public ICollection<SaleItem> SaleItems { get; set; } = [];
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
