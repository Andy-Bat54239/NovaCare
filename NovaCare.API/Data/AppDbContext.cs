using Microsoft.EntityFrameworkCore;
using NovaCare.API.Models;

namespace NovaCare.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ChatConversation> ChatConversations => Set<ChatConversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<StaffConversation> StaffConversations => Set<StaffConversation>();
    public DbSet<StaffMessage> StaffMessages => Set<StaffMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Decimal precision
        modelBuilder.Entity<Medicine>().Property(m => m.Price).HasPrecision(12, 2);
        modelBuilder.Entity<Batch>().Property(b => b.CostPrice).HasPrecision(12, 2);
        modelBuilder.Entity<Sale>().Property(s => s.TotalAmount).HasPrecision(12, 2);
        modelBuilder.Entity<SaleItem>().Property(s => s.UnitPrice).HasPrecision(12, 2);
        modelBuilder.Entity<SaleItem>().Property(s => s.Subtotal).HasPrecision(12, 2);
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasPrecision(12, 2);
        modelBuilder.Entity<OrderItem>().Property(o => o.UnitPrice).HasPrecision(12, 2);

        // Relationships — use NoAction to avoid SQL Server multiple cascade path errors
        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Customer)
            .WithMany(c => c.Sales)
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Branch)
            .WithMany(b => b.Sales)
            .HasForeignKey(s => s.BranchId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Sale>()
            .HasOne(s => s.User)
            .WithMany(u => u.Sales)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.ApprovedBy)
            .WithMany()
            .HasForeignKey(o => o.ApprovedById)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Branch)
            .WithMany(b => b.Orders)
            .HasForeignKey(o => o.BranchId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<User>()
            .HasOne(u => u.Branch)
            .WithMany(b => b.Users)
            .HasForeignKey(u => u.BranchId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.CustomerUser)
            .WithMany()
            .HasForeignKey(o => o.CustomerUserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ChatConversation>()
            .HasOne(c => c.CustomerUser)
            .WithMany()
            .HasForeignKey(c => c.CustomerUserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ChatConversation>()
            .HasOne(c => c.Branch)
            .WithMany(b => b.ChatConversations)
            .HasForeignKey(c => c.BranchId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ChatMessage>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatMessage>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.NoAction);

        // Staff-to-staff conversations
        modelBuilder.Entity<StaffConversation>()
            .HasOne(c => c.User1)
            .WithMany()
            .HasForeignKey(c => c.User1Id)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<StaffConversation>()
            .HasOne(c => c.User2)
            .WithMany()
            .HasForeignKey(c => c.User2Id)
            .OnDelete(DeleteBehavior.NoAction);

        // Unique index: only one conversation per pair
        modelBuilder.Entity<StaffConversation>()
            .HasIndex(c => new { c.User1Id, c.User2Id })
            .IsUnique();

        modelBuilder.Entity<StaffMessage>()
            .HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StaffMessage>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Batch>()
            .HasOne(b => b.Branch)
            .WithMany()
            .HasForeignKey(b => b.BranchId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<AuditLog>()
            .HasOne(a => a.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ContactMessage>()
            .HasOne(m => m.Branch)
            .WithMany(b => b.ContactMessages)
            .HasForeignKey(m => m.BranchId)
            .OnDelete(DeleteBehavior.NoAction);

        // ── SEED DATA ──────────────────────────────────────────────

        // Branches
        modelBuilder.Entity<Branch>().HasData(
            new Branch { Id = 1, Name = "Nyarugenge Main Branch", Address = "KN 4 Ave, Nyarugenge, Kigali", Phone = "+250 788 123 456", IsActive = true },
            new Branch { Id = 2, Name = "Kicukiro Medical Center", Address = "KK 15 Rd, Kicukiro, Kigali", Phone = "+250 722 987 654", IsActive = true },
            new Branch { Id = 3, Name = "Remera Plaza Branch", Address = "KG 11 Ave, Remera, Kigali", Phone = "+250 733 456 789", IsActive = true },
            new Branch { Id = 4, Name = "Huye Branch", Address = "National University Ave, Huye", Phone = "+250 788 654 321", IsActive = false }
        );

        // Users — passwords pre-hashed (static) to avoid PendingModelChangesWarning
        // Plain passwords: admin123, manager123, pharma123
        const string adminHash   = "$2a$11$jMB7.6xlZUYdWazmTtIToO8sp1Fv8ls6xPo7G/yTtuCBP/zq8yNdm";
        const string managerHash = "$2a$11$Aud1nPFualk4FDnVU5KT/ulvxgUxtSa2mjrlfrasZVKIIB3aZwSPe";
        const string pharmaHash  = "$2a$11$S7dudiRq230EYCsYZ1Jewe/EZJkb4NEJBMZGui1mJa/EN/KYSfEq.";

        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, FirstName = "Admin",  LastName = "User",      Email = "admin@novacare.rw",   PasswordHash = adminHash,   Role = 1, BranchId = 1, IsActive = true, MustChangePassword = false, Permissions = null, OtpCode = null, OtpExpiry = null, CreatedAt = new DateTime(2025, 1,  1,  0, 0, 0, DateTimeKind.Utc) },
            new User { Id = 2, FirstName = "Rachel", LastName = "Green",     Email = "rachel@novacare.rw",  PasswordHash = managerHash, Role = 2, BranchId = 1, IsActive = true, MustChangePassword = false, Permissions = null, OtpCode = null, OtpExpiry = null, CreatedAt = new DateTime(2025, 2, 15, 9, 0, 0, DateTimeKind.Utc) },
            new User { Id = 3, FirstName = "Marcus", LastName = "Lee",       Email = "marcus@novacare.rw",  PasswordHash = managerHash, Role = 2, BranchId = 2, IsActive = true, MustChangePassword = false, Permissions = null, OtpCode = null, OtpExpiry = null, CreatedAt = new DateTime(2025, 3,  1, 9, 0, 0, DateTimeKind.Utc) },
            new User { Id = 4, FirstName = "Fatima", LastName = "Al-Rashid", Email = "fatima@novacare.rw",  PasswordHash = managerHash, Role = 2, BranchId = 3, IsActive = true, MustChangePassword = false, Permissions = null, OtpCode = null, OtpExpiry = null, CreatedAt = new DateTime(2025, 3, 20, 9, 0, 0, DateTimeKind.Utc) },
            new User { Id = 5, FirstName = "James",  LastName = "Carter",    Email = "james@novacare.rw",   PasswordHash = pharmaHash,  Role = 3, BranchId = 1, IsActive = true, MustChangePassword = false, Permissions = null, OtpCode = null, OtpExpiry = null, CreatedAt = new DateTime(2025, 4, 10, 9, 0, 0, DateTimeKind.Utc) },
            new User { Id = 6, FirstName = "Sophie", LastName = "Nguyen",    Email = "sophie@novacare.rw",  PasswordHash = pharmaHash,  Role = 3, BranchId = 2, IsActive = true, MustChangePassword = false, Permissions = null, OtpCode = null, OtpExpiry = null, CreatedAt = new DateTime(2025, 5,  1, 9, 0, 0, DateTimeKind.Utc) },
            new User { Id = 7, FirstName = "Omar",   LastName = "Hassan",    Email = "omar@novacare.rw",    PasswordHash = pharmaHash,  Role = 3, BranchId = 3, IsActive = true, MustChangePassword = false, Permissions = null, OtpCode = null, OtpExpiry = null, CreatedAt = new DateTime(2025, 6, 15, 9, 0, 0, DateTimeKind.Utc) }
        );

        // Medicines
        modelBuilder.Entity<Medicine>().HasData(
            new Medicine { Id = 1, GenericName = "Amoxicillin", BrandName = "Amoxil", Strength = "500mg", Form = "Capsule", Category = "Antibiotics", RequiresPrescription = true, Price = 16900, ImagePath = "/medicines/amoxil.jpeg", Description = "A penicillin-type antibiotic used to treat a wide variety of bacterial infections." },
            new Medicine { Id = 2, GenericName = "Ibuprofen", BrandName = "Advil", Strength = "200mg", Form = "Tablet", Category = "Pain Relief", RequiresPrescription = false, Price = 11000, ImagePath = "/medicines/advil.jpeg", Description = "A nonsteroidal anti-inflammatory drug used to reduce fever and treat pain or inflammation." },
            new Medicine { Id = 3, GenericName = "Metformin", BrandName = "Glucophage", Strength = "500mg", Form = "Tablet", Category = "Diabetes", RequiresPrescription = true, Price = 19500, ImagePath = "/medicines/glucophage.jpeg", Description = "An oral diabetes medicine that helps control blood sugar levels." },
            new Medicine { Id = 4, GenericName = "Amlodipine", BrandName = "Norvasc", Strength = "5mg", Form = "Tablet", Category = "Cardiovascular", RequiresPrescription = true, Price = 24100, ImagePath = "/medicines/norvasc.jpeg", Description = "A calcium channel blocker used to treat high blood pressure and coronary artery disease." },
            new Medicine { Id = 5, GenericName = "Paracetamol", BrandName = "Tylenol", Strength = "500mg", Form = "Tablet", Category = "Pain Relief", RequiresPrescription = false, Price = 7800, ImagePath = "/medicines/tylenol.jpeg", Description = "An analgesic and antipyretic used to treat mild to moderate pain and reduce fever." },
            new Medicine { Id = 6, GenericName = "Omeprazole", BrandName = "Prilosec", Strength = "20mg", Form = "Capsule", Category = "Gastrointestinal", RequiresPrescription = false, Price = 20800, ImagePath = "/medicines/Prilosec.jpeg", Description = "A proton pump inhibitor used to treat gastroesophageal reflux disease and stomach ulcers." },
            new Medicine { Id = 7, GenericName = "Cetirizine", BrandName = "Zyrtec", Strength = "10mg", Form = "Tablet", Category = "Respiratory", RequiresPrescription = false, Price = 13000, ImagePath = "/medicines/Zyrtec.jpeg", Description = "An antihistamine used to relieve allergy symptoms such as runny nose and sneezing." },
            new Medicine { Id = 8, GenericName = "Atorvastatin", BrandName = "Lipitor", Strength = "20mg", Form = "Tablet", Category = "Cardiovascular", RequiresPrescription = true, Price = 29900, ImagePath = "/medicines/Lipitor.jpeg", Description = "A statin medication used to prevent cardiovascular disease and treat abnormal lipid levels." },
            new Medicine { Id = 9, GenericName = "Azithromycin", BrandName = "Zithromax", Strength = "250mg", Form = "Tablet", Category = "Antibiotics", RequiresPrescription = true, Price = 26000, ImagePath = "/medicines/zithromax.jpeg", Description = "A macrolide antibiotic used to treat various bacterial infections." },
            new Medicine { Id = 10, GenericName = "Salbutamol", BrandName = "Ventolin", Strength = "100mcg", Form = "Injection", Category = "Respiratory", RequiresPrescription = true, Price = 32500, ImagePath = "/medicines/Ventolin.jpeg", Description = "A bronchodilator used to relieve bronchospasm in conditions such as asthma." },
            new Medicine { Id = 11, GenericName = "Vitamin C", BrandName = "Celin", Strength = "500mg", Form = "Tablet", Category = "Vitamins", RequiresPrescription = false, Price = 8400, ImagePath = "/medicines/Celin.jpeg", Description = "An essential vitamin supplement to support immune function and overall health." },
            new Medicine { Id = 12, GenericName = "Hydrocortisone", BrandName = "Cortef", Strength = "1%", Form = "Cream", Category = "Dermatology", RequiresPrescription = false, Price = 15600, ImagePath = "/medicines/cortef.jpeg", Description = "A topical corticosteroid used to reduce inflammation, redness, and itching of the skin." },
            new Medicine { Id = 13, GenericName = "Losartan", BrandName = "Cozaar", Strength = "50mg", Form = "Tablet", Category = "Cardiovascular", RequiresPrescription = true, Price = 21500, ImagePath = "/medicines/Cozaar.jpeg", Description = "An angiotensin receptor blocker used to treat high blood pressure." },
            new Medicine { Id = 14, GenericName = "Metronidazole", BrandName = "Flagyl", Strength = "400mg", Form = "Tablet", Category = "Antibiotics", RequiresPrescription = true, Price = 14300, ImagePath = "/medicines/Flagyl.jpeg", Description = "An antibiotic and antiprotozoal medication used to treat bacterial and parasitic infections." },
            new Medicine { Id = 15, GenericName = "Ciprofloxacin", BrandName = "Cipro", Strength = "500mg", Form = "Tablet", Category = "Antibiotics", RequiresPrescription = true, Price = 18200, ImagePath = "/medicines/Cipro.jpeg", Description = "A fluoroquinolone antibiotic used to treat a variety of bacterial infections." },
            new Medicine { Id = 16, GenericName = "Multivitamin", BrandName = "Centrum", Strength = "Complex", Form = "Tablet", Category = "Vitamins", RequiresPrescription = false, Price = 16200, ImagePath = "/medicines/Centrum.jpeg", Description = "A comprehensive multivitamin supplement for daily nutritional support." },
            new Medicine { Id = 17, GenericName = "Diclofenac", BrandName = "Voltaren", Strength = "50mg", Form = "Tablet", Category = "Pain Relief", RequiresPrescription = false, Price = 12300, ImagePath = "/medicines/Voltaren.jpeg", Description = "A nonsteroidal anti-inflammatory drug used to treat pain and inflammatory disorders." },
            new Medicine { Id = 18, GenericName = "Ranitidine", BrandName = "Zantac", Strength = "150mg", Form = "Tablet", Category = "Gastrointestinal", RequiresPrescription = false, Price = 14900, ImagePath = "/medicines/Zantac.jpeg", Description = "An H2 blocker used to reduce stomach acid production and treat heartburn." },
            new Medicine { Id = 19, GenericName = "Clotrimazole", BrandName = "Canesten", Strength = "1%", Form = "Cream", Category = "Dermatology", RequiresPrescription = false, Price = 11700, ImagePath = "/medicines/Canesten.jpeg", Description = "An antifungal medication used to treat skin infections such as athletes foot and ringworm." },
            new Medicine { Id = 20, GenericName = "Insulin Glargine", BrandName = "Lantus", Strength = "100IU/ml", Form = "Injection", Category = "Diabetes", RequiresPrescription = true, Price = 59800, ImagePath = "/medicines/Lantus.jpeg", Description = "A long-acting insulin used to treat diabetes mellitus." },
            new Medicine { Id = 21, GenericName = "Lisinopril", BrandName = "Zestril", Strength = "10mg", Form = "Tablet", Category = "Cardiovascular", RequiresPrescription = true, Price = 19500, ImagePath = "/medicines/Zestril.jpeg", Description = "An ACE inhibitor used to treat high blood pressure and heart failure." },
            new Medicine { Id = 22, GenericName = "Doxycycline", BrandName = "Vibramycin", Strength = "100mg", Form = "Capsule", Category = "Antibiotics", RequiresPrescription = true, Price = 15600, ImagePath = "/medicines/Vibramycin.jpeg", Description = "A tetracycline antibiotic used to treat bacterial infections and prevent malaria." },
            new Medicine { Id = 23, GenericName = "Loratadine", BrandName = "Claritin", Strength = "10mg", Form = "Tablet", Category = "Respiratory", RequiresPrescription = false, Price = 13600, ImagePath = "/medicines/Claritin.jpeg", Description = "A non-drowsy antihistamine used to relieve symptoms of seasonal allergies." },
            new Medicine { Id = 24, GenericName = "Calcium + Vitamin D", BrandName = "Caltrate", Strength = "600mg", Form = "Tablet", Category = "Vitamins", RequiresPrescription = false, Price = 18200, ImagePath = "/medicines/Caltrate.jpeg", Description = "A calcium supplement with vitamin D for bone health support." }
        );

        // Customers
        modelBuilder.Entity<Customer>().HasData(
            new Customer { Id = 1, Name = "Mugisha Jean", Email = "mugisha.jean@gmail.com", Phone = "+250 788 100 001", Address = "KG 5 Ave, Kigali", CreatedAt = new DateTime(2025, 1, 10, 0, 0, 0, DateTimeKind.Utc) },
            new Customer { Id = 2, Name = "Uwimana Alice", Email = "uwimana.alice@gmail.com", Phone = "+250 722 100 002", Address = "KN 12 Rd, Kigali", CreatedAt = new DateTime(2025, 2, 5, 0, 0, 0, DateTimeKind.Utc) },
            new Customer { Id = 3, Name = "Habimana Eric", Email = "habimana.eric@yahoo.com", Phone = "+250 733 100 003", Address = "KK 8 Ave, Kigali", CreatedAt = new DateTime(2025, 3, 12, 0, 0, 0, DateTimeKind.Utc) },
            new Customer { Id = 4, Name = "Mukamana Grace", Email = "mukamana.grace@gmail.com", Phone = "+250 788 100 004", Address = "Huye Town", CreatedAt = new DateTime(2025, 4, 18, 0, 0, 0, DateTimeKind.Utc) },
            new Customer { Id = 5, Name = "Niyonzima Patrick", Email = "niyonzima.p@gmail.com", Phone = "+250 722 100 005", Address = "Remera, Kigali", CreatedAt = new DateTime(2025, 5, 22, 0, 0, 0, DateTimeKind.Utc) }
        );
    }
}
