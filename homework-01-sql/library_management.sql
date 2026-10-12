CREATE DATABASE library_db;
USE library_db;

CREATE TABLE authors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author_name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100)
);

CREATE TABLE books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author_id INT,
    category VARCHAR(100),
    publish_year INT,
    FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE borrow_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT,
    borrower_name VARCHAR(255) NOT NULL,
    borrow_date DATE,
    return_date DATE,
    FOREIGN KEY (book_id) REFERENCES books(id)
);

INSERT INTO authors (author_name, nationality) VALUES
('J.K. Rowling', 'British'),
('George Orwell', 'British'),
('Haruki Murakami', 'Japanese');

INSERT INTO books (title, author_id, category, publish_year) VALUES
('Harry Potter and the Sorcerer''s Stone', 1, 'Fantasy', 1997),
('1984', 2, 'Dystopian Fiction', 1949),
('Norwegian Wood', 3, 'Romance', 1987);

INSERT INTO borrow_records (book_id, borrower_name, borrow_date, return_date) VALUES
(1, 'Alice Johnson', '2023-10-01', '2023-10-15'),
(2, 'Bob Smith', '2023-10-05', '2023-10-19'),
(3, 'Charlie Brown', '2023-10-10', NULL); 

SELECT 
    b.title AS 'Book Title', 
    a.author_name AS 'Author Name', 
    br.borrower_name AS 'Borrower Name', 
    br.borrow_date AS 'Borrow Date'
FROM books b
JOIN authors a ON b.author_id = a.id
JOIN borrow_records br ON b.id = br.book_id;