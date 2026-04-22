namespace NovaCare.API.Models;

public class Sale
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int? CustomerId { get; set; }
    public int UserId { get; set; }
    public int BranchId { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? Notes { get; set; }
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    // Navigation (nullable to allow model binding)
    public Customer? Customer { get; set; }
    public User? User { get; set; }
    public Branch? Branch { get; set; }
    public ICollection<SaleItem> Items { get; set; } = [];
}

public class SaleItem
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public int MedicineId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }

    // Navigation (nullable to allow model binding)
    public Sale? Sale { get; set; }
    public Medicine? Medicine { get; set; }
}
