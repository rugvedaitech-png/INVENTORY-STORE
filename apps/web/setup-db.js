const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    console.log('Setting up MySQL database...');
    
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      port: 3306
    });
    
    console.log('Connected to MySQL server');
    
    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS inventory_store');
    console.log('Database inventory_store created or already exists');
    
    // Use the database
    await connection.execute('USE inventory_store');
    console.log('Using database inventory_store');
    
    // Test the connection
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Database connection test successful:', rows[0]);
    
    await connection.end();
    console.log('Database setup completed successfully');
    
  } catch (error) {
    console.error('Database setup failed:', error.message);
    console.log('\nPossible solutions:');
    console.log('1. Make sure MySQL server is running');
    console.log('2. Check if the username/password is correct');
    console.log('3. Check if MySQL is running on port 3306');
    console.log('4. Install MySQL if not installed');
  }
}

setupDatabase();
