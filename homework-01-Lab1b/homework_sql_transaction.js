const mysql = require("mysql2/promise");

const databaseName = "store_transaction_db";

const serverConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Nhan20*6",
};

const orderConfig = {
  customerId: Number(process.env.CUSTOMER_ID || 1),
  productId: Number(process.env.PRODUCT_ID || 1),
  quantity: Number(process.env.ORDER_QUANTITY || 1),
};

async function createSchema() {
  const connection = await mysql.createConnection(serverConfig);

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    await connection.query(`USE \`${databaseName}\``);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(100) NOT NULL,
        balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00
      ) ENGINE = InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_name VARCHAR(150) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0
      ) ENGINE = InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        customer_id INT NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      ) ENGINE = InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      ) ENGINE = InnoDB
    `);
  } finally {
    await connection.end();
  }
}

async function createOrder({ customerId, productId, quantity }) {
  if (!Number.isInteger(customerId) || customerId <= 0) {
    throw new Error("customerId must be a positive integer.");
  }
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error("productId must be a positive integer.");
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("quantity must be a positive integer.");
  }

  const connection = await mysql.createConnection({
    ...serverConfig,
    database: databaseName,
  });

  try {
    await connection.beginTransaction();

    // Step 1: lock and check both records before changing either one.
    const [customers] = await connection.execute(
      "SELECT balance FROM customers WHERE id = ? FOR UPDATE",
      [customerId],
    );
    const [products] = await connection.execute(
      "SELECT price, stock FROM products WHERE id = ? FOR UPDATE",
      [productId],
    );

    if (customers.length === 0) {
      throw new Error(`Customer ${customerId} does not exist.`);
    }
    if (products.length === 0) {
      throw new Error(`Product ${productId} does not exist.`);
    }

    const customer = customers[0];
    const product = products[0];
    const totalAmount = Number(product.price) * quantity;

    if (Number(customer.balance) < totalAmount) {
      throw new Error("Insufficient customer balance.");
    }
    if (product.stock < quantity) {
      throw new Error("Insufficient product stock.");
    }

    // Step 2: deduct the order total from the customer's balance.
    await connection.execute(
      "UPDATE customers SET balance = balance - ? WHERE id = ?",
      [totalAmount, customerId],
    );

    // Step 3: deduct the requested quantity from product stock.
    await connection.execute(
      "UPDATE products SET stock = stock - ? WHERE id = ?",
      [quantity, productId],
    );

    // Step 4: insert the order header.
    const [orderResult] = await connection.execute(
      "INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)",
      [customerId, totalAmount],
    );

    // Step 5: insert the corresponding line item.
    await connection.execute(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
      [orderResult.insertId, productId, quantity, product.price],
    );

    await connection.commit();
    return {
      orderId: orderResult.insertId,
      customerId,
      productId,
      quantity,
      totalAmount: totalAmount.toFixed(2),
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      error.message += ` Rollback failed: ${rollbackError.message}`;
    }
    throw error;
  } finally {
    await connection.end();
  }
}

async function main() {
  await createSchema();
  const order = await createOrder(orderConfig);
  console.log("Order committed successfully:", order);
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Order transaction rolled back:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { createOrder, createSchema };