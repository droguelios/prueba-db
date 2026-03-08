const pool = require('../config/mysql');

// Función para crear tablas en MySQL
const createTables = async () => {
    try {
        // Crear tabla de usuarios
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla de productos
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla de ventas
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                product_id INT,
                quantity INT NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        console.log('Tablas creadas exitosamente');
    } catch (error) {
        console.error('Error creando tablas:', error);
        throw error;
    }
};

// Función para sembrar datos iniciales
const seedData = async () => {
    try {
        // Insertar usuarios de ejemplo
        await pool.execute(`
            INSERT IGNORE INTO users (name, email) VALUES
            ('Juan Pérez', 'juan@example.com'),
            ('María García', 'maria@example.com')
        `);

        // Insertar productos de ejemplo
        await pool.execute(`
            INSERT IGNORE INTO products (name, price, description) VALUES
            ('Producto A', 100.00, 'Descripción del producto A'),
            ('Producto B', 200.00, 'Descripción del producto B')
        `);

        console.log('Datos sembrados exitosamente');
    } catch (error) {
        console.error('Error sembrando datos:', error);
        throw error;
    }
};

// Función principal para ejecutar migraciones
const runMigrations = async () => {
    try {
        await createTables();
        await seedData();
        console.log('Migraciones completadas');
    } catch (error) {
        console.error('Error en migraciones:', error);
        throw error;
    }
};

module.exports = {
    createTables,
    seedData,
    runMigrations
};
