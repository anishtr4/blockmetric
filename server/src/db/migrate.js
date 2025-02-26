require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function executeMigration() {
  try {
    // Create connection using mysql2
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'blockmetric'
    });

    console.log('Connected to database successfully');

    // Read and execute the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '20240131_add_columns_to_pageviews.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL file into individual statements
    const statements = migrationSQL
      .split(';')
      .filter(statement => statement.trim().length > 0);

    // Execute each statement
    for (const statement of statements) {
      await connection.query(statement);
      console.log('Executed statement successfully');
    }

    console.log('Migration completed successfully');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

executeMigration();