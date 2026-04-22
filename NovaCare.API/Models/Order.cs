namespace NovaCare.API.Models;

public class Order
{
    public int Id { get; set; }
    public string? CustomerId_External { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int BranchId { get; set; }
    public string Status { get; set; } = "Pending";
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public int? ApprovedById { get; set; }
    public bool HasPrescription { get; set; }
    public int? CustomerUserId { get; set; }

    // Navigation
    public Branch Branch { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public User? CustomerUser { get; set; }
    public ICollection<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int MedicineId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? PrescriptionImagePath { get; set; }
    public string? PrescriptionFileName { get; set; }

    // Navigation
    public Order Order { get; set; } = null!;
    public Medicine Medicine { get; set; } = null!;
}
