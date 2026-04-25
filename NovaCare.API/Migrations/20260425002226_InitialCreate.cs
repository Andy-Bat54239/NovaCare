using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace NovaCare.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Medicines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GenericName = table.Column<string>(type: "text", nullable: false),
                    BrandName = table.Column<string>(type: "text", nullable: false),
                    Strength = table.Column<string>(type: "text", nullable: false),
                    Form = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    RequiresPrescription = table.Column<bool>(type: "boolean", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    ImagePath = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medicines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContactMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<int>(type: "integer", nullable: true),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ReplyText = table.Column<string>(type: "text", nullable: true),
                    RepliedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactMessages_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    BranchId = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    MustChangePassword = table.Column<bool>(type: "boolean", nullable: false),
                    Permissions = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OtpCode = table.Column<string>(type: "text", nullable: true),
                    OtpExpiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Batches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MedicineId = table.Column<int>(type: "integer", nullable: false),
                    BranchId = table.Column<int>(type: "integer", nullable: false),
                    BatchNumber = table.Column<string>(type: "text", nullable: false),
                    InitialQuantity = table.Column<int>(type: "integer", nullable: false),
                    RemainingQuantity = table.Column<int>(type: "integer", nullable: false),
                    ManufacturingDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Supplier = table.Column<string>(type: "text", nullable: false),
                    CostPrice = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Batches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Batches_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Batches_Medicines_MedicineId",
                        column: x => x.MedicineId,
                        principalTable: "Medicines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Module = table.Column<string>(type: "text", nullable: false),
                    Details = table.Column<string>(type: "text", nullable: true),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatConversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerUserId = table.Column<int>(type: "integer", nullable: false),
                    TargetRole = table.Column<int>(type: "integer", nullable: false),
                    BranchId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatConversations_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ChatConversations_Users_CustomerUserId",
                        column: x => x.CustomerUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId_External = table.Column<string>(type: "text", nullable: true),
                    CustomerName = table.Column<string>(type: "text", nullable: false),
                    CustomerEmail = table.Column<string>(type: "text", nullable: false),
                    CustomerPhone = table.Column<string>(type: "text", nullable: false),
                    BranchId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    OrderDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApprovedById = table.Column<int>(type: "integer", nullable: true),
                    HasPrescription = table.Column<bool>(type: "boolean", nullable: false),
                    CustomerUserId = table.Column<int>(type: "integer", nullable: true),
                    CustomerId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Orders_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Orders_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Orders_Users_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Orders_Users_CustomerUserId",
                        column: x => x.CustomerUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Sales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InvoiceNumber = table.Column<string>(type: "text", nullable: false),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    BranchId = table.Column<int>(type: "integer", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    PaymentMethod = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    SaleDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sales_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Sales_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Sales_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "StaffConversations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    User1Id = table.Column<int>(type: "integer", nullable: false),
                    User2Id = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffConversations_Users_User1Id",
                        column: x => x.User1Id,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_StaffConversations_Users_User2Id",
                        column: x => x.User2Id,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConversationId = table.Column<int>(type: "integer", nullable: false),
                    SenderId = table.Column<int>(type: "integer", nullable: false),
                    SenderName = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_ChatConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "ChatConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "OrderItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OrderId = table.Column<int>(type: "integer", nullable: false),
                    MedicineId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    PrescriptionImagePath = table.Column<string>(type: "text", nullable: true),
                    PrescriptionFileName = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderItems_Medicines_MedicineId",
                        column: x => x.MedicineId,
                        principalTable: "Medicines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SaleItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SaleId = table.Column<int>(type: "integer", nullable: false),
                    MedicineId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SaleItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SaleItems_Medicines_MedicineId",
                        column: x => x.MedicineId,
                        principalTable: "Medicines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SaleItems_Sales_SaleId",
                        column: x => x.SaleId,
                        principalTable: "Sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ConversationId = table.Column<int>(type: "integer", nullable: false),
                    SenderId = table.Column<int>(type: "integer", nullable: false),
                    SenderName = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffMessages_StaffConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "StaffConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StaffMessages_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Branches",
                columns: new[] { "Id", "Address", "IsActive", "Name", "Phone" },
                values: new object[,]
                {
                    { 1, "KN 4 Ave, Nyarugenge, Kigali", true, "Nyarugenge Main Branch", "+250 788 123 456" },
                    { 2, "KK 15 Rd, Kicukiro, Kigali", true, "Kicukiro Medical Center", "+250 722 987 654" },
                    { 3, "KG 11 Ave, Remera, Kigali", true, "Remera Plaza Branch", "+250 733 456 789" },
                    { 4, "National University Ave, Huye", false, "Huye Branch", "+250 788 654 321" }
                });

            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "Id", "Address", "CreatedAt", "Email", "Name", "Phone" },
                values: new object[,]
                {
                    { 1, "KG 5 Ave, Kigali", new DateTime(2025, 1, 10, 0, 0, 0, 0, DateTimeKind.Utc), "mugisha.jean@gmail.com", "Mugisha Jean", "+250 788 100 001" },
                    { 2, "KN 12 Rd, Kigali", new DateTime(2025, 2, 5, 0, 0, 0, 0, DateTimeKind.Utc), "uwimana.alice@gmail.com", "Uwimana Alice", "+250 722 100 002" },
                    { 3, "KK 8 Ave, Kigali", new DateTime(2025, 3, 12, 0, 0, 0, 0, DateTimeKind.Utc), "habimana.eric@yahoo.com", "Habimana Eric", "+250 733 100 003" },
                    { 4, "Huye Town", new DateTime(2025, 4, 18, 0, 0, 0, 0, DateTimeKind.Utc), "mukamana.grace@gmail.com", "Mukamana Grace", "+250 788 100 004" },
                    { 5, "Remera, Kigali", new DateTime(2025, 5, 22, 0, 0, 0, 0, DateTimeKind.Utc), "niyonzima.p@gmail.com", "Niyonzima Patrick", "+250 722 100 005" }
                });

            migrationBuilder.InsertData(
                table: "Medicines",
                columns: new[] { "Id", "BrandName", "Category", "Description", "Form", "GenericName", "ImagePath", "Price", "RequiresPrescription", "Strength" },
                values: new object[,]
                {
                    { 1, "Amoxil", "Antibiotics", "A penicillin-type antibiotic used to treat a wide variety of bacterial infections.", "Capsule", "Amoxicillin", "/medicines/amoxil.jpeg", 16900m, true, "500mg" },
                    { 2, "Advil", "Pain Relief", "A nonsteroidal anti-inflammatory drug used to reduce fever and treat pain or inflammation.", "Tablet", "Ibuprofen", "/medicines/advil.jpeg", 11000m, false, "200mg" },
                    { 3, "Glucophage", "Diabetes", "An oral diabetes medicine that helps control blood sugar levels.", "Tablet", "Metformin", "/medicines/glucophage.jpeg", 19500m, true, "500mg" },
                    { 4, "Norvasc", "Cardiovascular", "A calcium channel blocker used to treat high blood pressure and coronary artery disease.", "Tablet", "Amlodipine", "/medicines/norvasc.jpeg", 24100m, true, "5mg" },
                    { 5, "Tylenol", "Pain Relief", "An analgesic and antipyretic used to treat mild to moderate pain and reduce fever.", "Tablet", "Paracetamol", "/medicines/tylenol.jpeg", 7800m, false, "500mg" },
                    { 6, "Prilosec", "Gastrointestinal", "A proton pump inhibitor used to treat gastroesophageal reflux disease and stomach ulcers.", "Capsule", "Omeprazole", "/medicines/Prilosec.jpeg", 20800m, false, "20mg" },
                    { 7, "Zyrtec", "Respiratory", "An antihistamine used to relieve allergy symptoms such as runny nose and sneezing.", "Tablet", "Cetirizine", "/medicines/Zyrtec.jpeg", 13000m, false, "10mg" },
                    { 8, "Lipitor", "Cardiovascular", "A statin medication used to prevent cardiovascular disease and treat abnormal lipid levels.", "Tablet", "Atorvastatin", "/medicines/Lipitor.jpeg", 29900m, true, "20mg" },
                    { 9, "Zithromax", "Antibiotics", "A macrolide antibiotic used to treat various bacterial infections.", "Tablet", "Azithromycin", "/medicines/zithromax.jpeg", 26000m, true, "250mg" },
                    { 10, "Ventolin", "Respiratory", "A bronchodilator used to relieve bronchospasm in conditions such as asthma.", "Injection", "Salbutamol", "/medicines/Ventolin.jpeg", 32500m, true, "100mcg" },
                    { 11, "Celin", "Vitamins", "An essential vitamin supplement to support immune function and overall health.", "Tablet", "Vitamin C", "/medicines/Celin.jpeg", 8400m, false, "500mg" },
                    { 12, "Cortef", "Dermatology", "A topical corticosteroid used to reduce inflammation, redness, and itching of the skin.", "Cream", "Hydrocortisone", "/medicines/cortef.jpeg", 15600m, false, "1%" },
                    { 13, "Cozaar", "Cardiovascular", "An angiotensin receptor blocker used to treat high blood pressure.", "Tablet", "Losartan", "/medicines/Cozaar.jpeg", 21500m, true, "50mg" },
                    { 14, "Flagyl", "Antibiotics", "An antibiotic and antiprotozoal medication used to treat bacterial and parasitic infections.", "Tablet", "Metronidazole", "/medicines/Flagyl.jpeg", 14300m, true, "400mg" },
                    { 15, "Cipro", "Antibiotics", "A fluoroquinolone antibiotic used to treat a variety of bacterial infections.", "Tablet", "Ciprofloxacin", "/medicines/Cipro.jpeg", 18200m, true, "500mg" },
                    { 16, "Centrum", "Vitamins", "A comprehensive multivitamin supplement for daily nutritional support.", "Tablet", "Multivitamin", "/medicines/Centrum.jpeg", 16200m, false, "Complex" },
                    { 17, "Voltaren", "Pain Relief", "A nonsteroidal anti-inflammatory drug used to treat pain and inflammatory disorders.", "Tablet", "Diclofenac", "/medicines/Voltaren.jpeg", 12300m, false, "50mg" },
                    { 18, "Zantac", "Gastrointestinal", "An H2 blocker used to reduce stomach acid production and treat heartburn.", "Tablet", "Ranitidine", "/medicines/Zantac.jpeg", 14900m, false, "150mg" },
                    { 19, "Canesten", "Dermatology", "An antifungal medication used to treat skin infections such as athletes foot and ringworm.", "Cream", "Clotrimazole", "/medicines/Canesten.jpeg", 11700m, false, "1%" },
                    { 20, "Lantus", "Diabetes", "A long-acting insulin used to treat diabetes mellitus.", "Injection", "Insulin Glargine", "/medicines/Lantus.jpeg", 59800m, true, "100IU/ml" },
                    { 21, "Zestril", "Cardiovascular", "An ACE inhibitor used to treat high blood pressure and heart failure.", "Tablet", "Lisinopril", "/medicines/Zestril.jpeg", 19500m, true, "10mg" },
                    { 22, "Vibramycin", "Antibiotics", "A tetracycline antibiotic used to treat bacterial infections and prevent malaria.", "Capsule", "Doxycycline", "/medicines/Vibramycin.jpeg", 15600m, true, "100mg" },
                    { 23, "Claritin", "Respiratory", "A non-drowsy antihistamine used to relieve symptoms of seasonal allergies.", "Tablet", "Loratadine", "/medicines/Claritin.jpeg", 13600m, false, "10mg" },
                    { 24, "Caltrate", "Vitamins", "A calcium supplement with vitamin D for bone health support.", "Tablet", "Calcium + Vitamin D", "/medicines/Caltrate.jpeg", 18200m, false, "600mg" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "BranchId", "CreatedAt", "Email", "FirstName", "IsActive", "LastName", "MustChangePassword", "OtpCode", "OtpExpiry", "PasswordHash", "Permissions", "Role" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@novacare.rw", "Admin", true, "User", false, null, null, "$2a$11$jMB7.6xlZUYdWazmTtIToO8sp1Fv8ls6xPo7G/yTtuCBP/zq8yNdm", null, 1 },
                    { 2, 1, new DateTime(2025, 2, 15, 9, 0, 0, 0, DateTimeKind.Utc), "rachel@novacare.rw", "Rachel", true, "Green", false, null, null, "$2a$11$Aud1nPFualk4FDnVU5KT/ulvxgUxtSa2mjrlfrasZVKIIB3aZwSPe", null, 2 },
                    { 3, 2, new DateTime(2025, 3, 1, 9, 0, 0, 0, DateTimeKind.Utc), "marcus@novacare.rw", "Marcus", true, "Lee", false, null, null, "$2a$11$Aud1nPFualk4FDnVU5KT/ulvxgUxtSa2mjrlfrasZVKIIB3aZwSPe", null, 2 },
                    { 4, 3, new DateTime(2025, 3, 20, 9, 0, 0, 0, DateTimeKind.Utc), "fatima@novacare.rw", "Fatima", true, "Al-Rashid", false, null, null, "$2a$11$Aud1nPFualk4FDnVU5KT/ulvxgUxtSa2mjrlfrasZVKIIB3aZwSPe", null, 2 },
                    { 5, 1, new DateTime(2025, 4, 10, 9, 0, 0, 0, DateTimeKind.Utc), "james@novacare.rw", "James", true, "Carter", false, null, null, "$2a$11$S7dudiRq230EYCsYZ1Jewe/EZJkb4NEJBMZGui1mJa/EN/KYSfEq.", null, 3 },
                    { 6, 2, new DateTime(2025, 5, 1, 9, 0, 0, 0, DateTimeKind.Utc), "sophie@novacare.rw", "Sophie", true, "Nguyen", false, null, null, "$2a$11$S7dudiRq230EYCsYZ1Jewe/EZJkb4NEJBMZGui1mJa/EN/KYSfEq.", null, 3 },
                    { 7, 3, new DateTime(2025, 6, 15, 9, 0, 0, 0, DateTimeKind.Utc), "omar@novacare.rw", "Omar", true, "Hassan", false, null, null, "$2a$11$S7dudiRq230EYCsYZ1Jewe/EZJkb4NEJBMZGui1mJa/EN/KYSfEq.", null, 3 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Batches_BranchId",
                table: "Batches",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Batches_MedicineId",
                table: "Batches",
                column: "MedicineId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversations_BranchId",
                table: "ChatConversations",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversations_CustomerUserId",
                table: "ChatConversations",
                column: "CustomerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ConversationId",
                table: "ChatMessages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId",
                table: "ChatMessages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactMessages_BranchId",
                table: "ContactMessages",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_MedicineId",
                table: "OrderItems",
                column: "MedicineId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ApprovedById",
                table: "Orders",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_BranchId",
                table: "Orders",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerId",
                table: "Orders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CustomerUserId",
                table: "Orders",
                column: "CustomerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SaleItems_MedicineId",
                table: "SaleItems",
                column: "MedicineId");

            migrationBuilder.CreateIndex(
                name: "IX_SaleItems_SaleId",
                table: "SaleItems",
                column: "SaleId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_BranchId",
                table: "Sales",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_CustomerId",
                table: "Sales",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_UserId",
                table: "Sales",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffConversations_User1Id_User2Id",
                table: "StaffConversations",
                columns: new[] { "User1Id", "User2Id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StaffConversations_User2Id",
                table: "StaffConversations",
                column: "User2Id");

            migrationBuilder.CreateIndex(
                name: "IX_StaffMessages_ConversationId",
                table: "StaffMessages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffMessages_SenderId",
                table: "StaffMessages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_BranchId",
                table: "Users",
                column: "BranchId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "Batches");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "ContactMessages");

            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "SaleItems");

            migrationBuilder.DropTable(
                name: "StaffMessages");

            migrationBuilder.DropTable(
                name: "ChatConversations");

            migrationBuilder.DropTable(
                name: "Orders");

            migrationBuilder.DropTable(
                name: "Medicines");

            migrationBuilder.DropTable(
                name: "Sales");

            migrationBuilder.DropTable(
                name: "StaffConversations");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Branches");
        }
    }
}
