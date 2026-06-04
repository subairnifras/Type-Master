import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Configuration fallbacks for local database connection
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'typemaster_db';

let pool: mysql.Pool;

export async function getDbPool(): Promise<mysql.Pool> {
  if (pool) return pool;

  // 1. Establish connection to MySQL without selecting database first, to ensure DB exists
  try {
    const tempConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await tempConnection.end();
  } catch (error) {
    console.error('Failed to ensure database existence:', error);
    // Keep going, pool might succeed if database already exists or if privileges are different
  }

  // 2. Create the connection pool with database selected
  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // 3. Run migrations / create tables
  await initializeDatabase(pool);

  return pool;
}

// Custom db helper to run queries easily
export async function query(sql: string, params?: any[]): Promise<any> {
  const dbPool = await getDbPool();
  const [results] = await dbPool.execute(sql, params);
  return results;
}

async function initializeDatabase(dbPool: mysql.Pool) {
  try {
    // Users table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        avatar_url VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Typing stats table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS typing_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        wpm DOUBLE NOT NULL,
        cpm DOUBLE NOT NULL,
        accuracy DOUBLE NOT NULL,
        test_mode VARCHAR(50) DEFAULT 'timed_60',
        duration INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Practice texts table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS practice_texts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default practice texts if empty
    const [textsCount] = await dbPool.query('SELECT COUNT(*) as count FROM practice_texts') as any[];
    if (textsCount[0]?.count === 0) {
      const defaultTexts = [
        {
          title: 'The Mechanical Keyboard',
          category: 'hardware',
          content: 'The satisfying click-clack of a mechanical keyboard is music to a typist\'s ears. Tactile switches provide tactile feedback, while linear ones offer a smooth keystroke. Custom keycaps, stabilizers, and lubricated switches elevate the typing experience to an art form.'
        },
        {
          title: 'A Glimpse into Space',
          category: 'science',
          content: 'Gazing up at the night sky, one cannot help but feel small in the face of the infinite cosmos. Billions of galaxies swirl in the dark expanse, each hosting countless stars and planets. Space exploration pushes the boundaries of human knowledge and sparks our imagination.'
        },
        {
          title: 'The Power of Coding',
          category: 'technology',
          content: 'Writing code is like casting spells in a digital realm. With a few lines of instructions, developers can build complex systems, automate tedious tasks, and create beautiful virtual experiences. Problem solving is at the core of software engineering, turning abstract ideas into functional reality.'
        },
        {
          title: 'Philosophy of Speed',
          category: 'philosophy',
          content: 'In typing, as in life, speed without accuracy is meaningless. A rapid pace is impressive, but errors disrupt the flow and require backtracking. Strive first for precision, and let the rhythm of your fingers naturally build the speed. True mastery is the perfect balance of both.'
        }
      ];

      for (const text of defaultTexts) {
        await dbPool.query(
          'INSERT INTO practice_texts (title, content, category) VALUES (?, ?, ?)',
          [text.title, text.content, text.category]
        );
      }
      console.log('Seeded default practice texts.');
    }

    // Seed default admin and user accounts if empty
    const [usersCount] = await dbPool.query('SELECT COUNT(*) as count FROM users') as any[];
    if (usersCount[0]?.count === 0) {
      const adminPassHash = await bcrypt.hash('admin123', 10);
      const userPassHash = await bcrypt.hash('player123', 10);

      // Create admin user
      await dbPool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@typemaster.com', adminPassHash, 'admin']
      );

      // Create sample user
      await dbPool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['typist_pro', 'player@typemaster.com', userPassHash, 'user']
      );

      console.log('Seeded default users (admin / typist_pro).');
    }
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
  }
}
