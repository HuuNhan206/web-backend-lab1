blog_db;

db.posts.insertMany([
  {
    title: "Building REST APIs with Express",
    category: "Tech",
    views: 150,
    author: {
      name: "Alice Johnson",
      email: "alice.j@example.com"
    },
    tags: ["nodejs", "express", "backend"],
    comments: [
      {
        user: "Bob",
        content: "Great tutorial for beginners!",
        created_at: new Date("2026-10-01T10:00:00Z")
      }
    ]
  },
  {
    title: "NoSQL vs SQL: When to choose what",
    category: "Tech",
    views: 85,
    author: {
      name: "Mark Smith",
      email: "mark.s@example.com"
    },
    tags: ["database", "mongodb", "sql"],
    comments: []
  },
  {
    title: "Mastering Asynchronous JavaScript",
    category: "Tech",
    views: 210,
    author: {
      name: "Alice Johnson",
      email: "alice.j@example.com"
    },
    tags: ["javascript", "nodejs", "async"],
    comments: [
      {
        user: "Charlie",
        content: "Promises finally make sense to me now.",
        created_at: new Date("2026-10-05T14:30:00Z")
      }
    ]
  },
  {
    title: "Minimalist Desk Setup 2026",
    category: "Lifestyle",
    views: 500,
    author: {
      name: "Diana Prince",
      email: "diana.p@example.com"
    },
    tags: ["productivity", "workspace"],
    comments: [
      {
        user: "Eve",
        content: "Love the cable management tips.",
        created_at: new Date("2026-10-10T09:15:00Z")
      }
    ]
  }
]);

// Query 1: Find posts in the 'Tech' category AND with views of 100 or more
db.posts.find({
  category: "Tech",
  views: { $gte: 100 }
});

// Query 2: Find all posts tagged with 'nodejs'
db.posts.find({
  tags: "nodejs"
});

// Update: Add a new comment to a specific post and increment its views count
db.posts.updateOne(
  { title: "Building REST APIs with Express" },
  {
    $push: {
      comments: {
        user: "Frank",
        content: "Can you make a part 2 on authentication?",
        created_at: new Date()
      }
    },
    $inc: { views: 1 }
  }
);

// Aggregation: Calculate total views and total posts, grouped by category
db.posts.aggregate([
  {
    $group: {
      _id: "$category",
      totalViews: { $sum: "$views" },
      totalPosts: { $sum: 1 }
    }
  }
]);