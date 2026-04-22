namespace NovaCare.API.Models;

public class Batch
{
    public int Id { get; set; }
    public int MedicineId { get; set; }
    public int BranchId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public int InitialQuantity { get; set; }
    public int RemainingQuantity { get; set; }
    public DateTime ManufacturingDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string Supplier { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Medicine Medicine { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
}
