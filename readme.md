# prueba-db

SQL (MySQL)
Used for transactional and relational data.
Normalized to 3NF to eliminate redundancy and ensure integrity.

MongoDB
Used for audit logs.
Deletion snapshots are embedded to preserve historical traceability.

Migration
POST /migrate
The migration process is idempotent.
Entities are checked before insertion using UNIQUE constraints and lookups.
 CRUD
Entity implemented: Products
Endpoints:
GET /products
POST /products
PUT /products/:id
DELETE /products/:id

Business Intelligence

GET /analytics/suppliers
GET /analytics/customer/:email
GET /analytics/top-products/:category
https://www.drawdb.app/editor?shareId=16b6633352870cf85c46a60c2154e95e
