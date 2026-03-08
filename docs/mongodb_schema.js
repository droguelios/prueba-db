// MegaStore Global - MongoDB Schema Validation and Collections
// Database: db_megastore_exam
// Strategy: Store detailed transaction records with embedded items, reference master data

// 1. Create Categories Collection with Validation
db.createCollection("categories", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "category_name"],
            properties: {
                _id: { bsonType: "objectId" },
                category_name: { 
                    bsonType: "string",
                    description: "Category name - must be unique"
                },
                description: { bsonType: "string" },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});
db.categories.createIndex({ category_name: 1 }, { unique: true });

// 2. Create Suppliers Collection with Validation
db.createCollection("suppliers", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "supplier_name", "contact_email"],
            properties: {
                _id: { bsonType: "objectId" },
                supplier_name: { 
                    bsonType: "string",
                    description: "Supplier name - must be unique"
                },
                contact_email: { bsonType: "string" },
                contact_phone: { bsonType: "string" },
                address: { bsonType: "string" },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});
db.suppliers.createIndex({ supplier_name: 1 }, { unique: true });
db.suppliers.createIndex({ contact_email: 1 }, { unique: true });

// 3. Create Customers Collection with Validation
db.createCollection("customers", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "customer_name", "email"],
            properties: {
                _id: { bsonType: "objectId" },
                customer_name: { bsonType: "string" },
                email: { 
                    bsonType: "string",
                    description: "Customer email - must be unique"
                },
                address: { bsonType: "string" },
                phone_number: { bsonType: "string" },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});
db.customers.createIndex({ email: 1 }, { unique: true });

// 4. Create Products Collection with Validation
db.createCollection("products", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "sku", "product_name", "category_id", "supplier_id", "unit_price"],
            properties: {
                _id: { bsonType: "objectId" },
                sku: { 
                    bsonType: "string",
                    description: "Stock Keeping Unit - must be unique"
                },
                product_name: { bsonType: "string" },
                category_id: { bsonType: "objectId" },
                supplier_id: { bsonType: "objectId" },
                unit_price: { bsonType: "double" },
                current_stock: { bsonType: "int" },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});
db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ category_id: 1 });
db.products.createIndex({ supplier_id: 1 });

// 5. Create Transactions Collection (DENORMALIZED for efficient reading)
// Strategy: Embed transaction items for faster reads, reference customer for relationships
db.createCollection("transactions", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "transaction_identifier", "customer_id", "transaction_date", "items"],
            properties: {
                _id: { bsonType: "objectId" },
                transaction_identifier: { 
                    bsonType: "string",
                    description: "Unique transaction ID - must be unique"
                },
                customer_id: { bsonType: "objectId" },
                customer_name: { bsonType: "string" },
                customer_email: { bsonType: "string" },
                transaction_date: { bsonType: "date" },
                items: {
                    bsonType: "array",
                    items: {
                        bsonType: "object",
                        properties: {
                            product_id: { bsonType: "objectId" },
                            sku: { bsonType: "string" },
                            product_name: { bsonType: "string" },
                            category: { bsonType: "string" },
                            quantity: { bsonType: "int" },
                            unit_price: { bsonType: "double" },
                            line_total: { bsonType: "double" }
                        }
                    }
                },
                total_amount: { bsonType: "double" },
                created_at: { bsonType: "date" }
            }
        }
    }
});
db.transactions.createIndex({ transaction_identifier: 1 }, { unique: true });
db.transactions.createIndex({ customer_id: 1 });
db.transactions.createIndex({ transaction_date: 1 });

// 6. Create Audit Log Collection (For tracking deletions)
db.createCollection("audit_logs", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "entity_type", "entity_id", "action"],
            properties: {
                _id: { bsonType: "objectId" },
                entity_type: { 
                    bsonType: "string",
                    description: "Type of entity (product, customer, transaction, supplier)"
                },
                entity_id: { bsonType: "objectId" },
                entity_data: { bsonType: "object" },
                action: { 
                    bsonType: "string",
                    description: "Action performed (DELETE, UPDATE, CREATE)"
                },
                performed_by: { bsonType: "string" },
                performed_at: { bsonType: "date" },
                reason: { bsonType: "string" },
                ip_address: { bsonType: "string" }
            }
        }
    }
});
db.audit_logs.createIndex({ entity_type: 1 });
db.audit_logs.createIndex({ performed_at: 1 });

// 7. Create Migration Log Collection
db.createCollection("migration_logs", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            properties: {
                _id: { bsonType: "objectId" },
                migration_file: { bsonType: "string" },
                total_rows: { bsonType: "int" },
                successful_rows: { bsonType: "int" },
                failed_rows: { bsonType: "int" },
                started_at: { bsonType: "date" },
                completed_at: { bsonType: "date" },
                status: { bsonType: "string" },
                error_message: { bsonType: "string" }
            }
        }
    }
});

// Insert sample data
db.categories.insertMany([
    { category_name: "Electronics", description: "Electronic devices and components" },
    { category_name: "Office", description: "Office supplies and furniture" }
]);

db.suppliers.insertMany([
    { 
        supplier_name: "TechSupplies Inc.", 
        contact_email: "contact@techsupplies.com",
        contact_phone: "+1-555-0001",
        address: "123 Tech Avenue, Silicon Valley, CA"
    },
    { 
        supplier_name: "FurnitureCo", 
        contact_email: "sales@furniturecо.com",
        contact_phone: "+1-555-0002",
        address: "456 Furniture Drive, Furniture City, NC"
    },
    { 
        supplier_name: "ScreenVendor Ltd.", 
        contact_email: "info@screenvend.com",
        contact_phone: "+1-555-0003",
        address: "789 Display Street, Display Town, TX"
    },
    { 
        supplier_name: "OfficeSuppliesHub", 
        contact_email: "bulk@officesupp.com",
        contact_phone: "+1-555-0004",
        address: "321 Supply Lane, Supply City, PA"
    }
]);

print("MongoDB collections created successfully with schema validation and sample data!");