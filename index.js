const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Build allowed origins - hardcode production URLs as fallback
const allowedOrigins = [
  "http://localhost:3000",
  "https://dishdelight-client.vercel.app",
];

// If CLIENT_ORIGIN is set, add it
if (process.env.CLIENT_ORIGIN) {
  const additionalOrigins = process.env.CLIENT_ORIGIN.split(",").map((origin) =>
    origin.trim()
  );
  allowedOrigins.push(...additionalOrigins);
}

console.log("CORS Origins configured:", allowedOrigins);
console.log("NODE_ENV:", process.env.NODE_ENV);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl requests, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS blocked origin:", origin);
        callback(new Error("CORS not allowed for origin: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Key"],
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dojua2g.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let usersCollection;
let itemsCollection;

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "dev-internal-key";

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role || "user",
});

const buildToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );

const authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Authorization token missing" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const DEFAULT_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";

const buildOwnershipQuery = (userId) => ({
  $or: [{ userId }, { ownerId: userId }],
});

const mapPublicItem = (item) => ({
  id: item._id.toString(),
  name: item.name,
  summary: item.summary,
  description: item.description,
  image: item.image,
  category: item.category,
  price: item.price,
  priority: item.priority,
  availableDate: item.availableDate,
  ownerId: item.ownerId,
  ownerEmail: item.ownerEmail,
  createdAt: item.createdAt,
});

const mapUserItem = (item) => ({
  ...mapPublicItem(item),
  userId: item.userId || item.ownerId,
});

const ensureOwnership = (item, userId) =>
  Boolean(item && (item.userId === userId || item.ownerId === userId));

const validatePriceValue = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return { valid: false, parsed: null };
  }
  return { valid: true, parsed };
};

const buildProductDocument = (body, userId, userEmail) => {
  const now = new Date();
  return {
    name: body.name,
    summary: body.summary,
    description: body.description,
    image: body.image || DEFAULT_ITEM_IMAGE,
    category: body.category,
    price: body.price,
    priority: body.priority || "medium",
    availableDate: body.availableDate || now.toISOString(),
    ownerId: userId,
    ownerEmail: userEmail,
    userId: userId,
    createdAt: now,
    updatedAt: now,
  };
};

const handleCreateProduct = async (req, res) => {
  try {
    const {
      name,
      summary,
      description,
      image,
      category,
      price,
      priority,
      availableDate,
    } = req.body;
    if (!name || !summary || !description || !category || price === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const { valid, parsed } = validatePriceValue(price);
    if (!valid) {
      return res
        .status(400)
        .json({ message: "Price must be a valid positive number" });
    }
    const productPayload = buildProductDocument(
      {
        name,
        summary,
        description,
        image,
        category,
        priority,
        availableDate,
        price: parsed,
      },
      req.user.sub,
      req.user.email
    );
    const { insertedId } = await itemsCollection.insertOne(productPayload);
    const created = await itemsCollection.findOne({ _id: insertedId });
    res.status(201).json(mapUserItem(created));
  } catch (error) {
    console.error("create product error", error);
    res.status(500).json({ message: "Unable to create product" });
  }
};

const handleDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!ensureOwnership(item, req.user.sub)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own products" });
    }
    await itemsCollection.deleteOne({ _id: item._id });
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("delete product error", error);
    res.status(500).json({ message: "Unable to delete product" });
  }
};

const handleUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!ensureOwnership(item, req.user.sub)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own products" });
    }
    const updates = {};
    const fields = [
      "name",
      "summary",
      "description",
      "image",
      "category",
      "priority",
      "availableDate",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    if (req.body.price !== undefined) {
      const { valid, parsed } = validatePriceValue(req.body.price);
      if (!valid) {
        return res
          .status(400)
          .json({ message: "Price must be a valid positive number" });
      }
      updates.price = parsed;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "No changes provided" });
    }
    updates.updatedAt = new Date();
    await itemsCollection.updateOne({ _id: item._id }, { $set: updates });
    const updated = await itemsCollection.findOne({ _id: item._id });
    res.json(mapUserItem(updated));
  } catch (error) {
    console.error("update product error", error);
    res.status(500).json({ message: "Unable to update product" });
  }
};

async function init() {
  await client.connect();
  const db = client.db(process.env.DB_NAME || "dishdelight");
  usersCollection = db.collection("users");
  itemsCollection = db.collection("food_items");
  console.log("Connected to MongoDB and ready");
}

app.get("/", (_req, res) => {
  res.json({
    message: "Dish Delight API Server",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "GET /health",
      items: "GET /items",
      itemDetail: "GET /items/:id",
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        oauth: "POST /auth/oauth",
      },
      protected: {
        myItems: "GET /items/mine",
        products: "GET /products",
        createProduct: "POST /products",
        updateProduct: "PUT /products/:id",
        deleteProduct: "DELETE /products/:id",
      },
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      provider: "credentials",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { insertedId } = await usersCollection.insertOne(newUser);
    const insertedUser = { ...newUser, _id: insertedId };
    const token = buildToken(insertedUser);
    res.status(201).json({ user: sanitizeUser(insertedUser), token });
  } catch (error) {
    console.error("register error", error);
    res.status(500).json({ message: "Unable to register user" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = buildToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error("login error", error);
    res.status(500).json({ message: "Unable to login" });
  }
});

app.post("/auth/oauth", async (req, res) => {
  try {
    const internalKey = req.headers["x-internal-key"];
    if (internalKey !== INTERNAL_API_KEY) {
      return res.status(401).json({ message: "Unauthorized request" });
    }
    const { email, name, provider } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required" });
    }
    const normalizedEmail = email.toLowerCase();
    const now = new Date();
    const result = await usersCollection.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          name,
          email: normalizedEmail,
          provider: provider || "google",
          role: "user",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    const user = result.value || result;
    if (!user || !user._id) {
      return res
        .status(500)
        .json({ message: "Failed to retrieve user after sync" });
    }
    const token = buildToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error("oauth sync error", error);
    res.status(500).json({ message: "Unable to sync OAuth user" });
  }
});

app.get("/items", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filters = {};
    if (search) {
      filters.name = { $regex: search, $options: "i" };
    }
    if (category) {
      filters.category = { $regex: `^${category}$`, $options: "i" };
    }
    const items = await itemsCollection
      .find(filters)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(items.map(mapPublicItem));
  } catch (error) {
    console.error("fetch items error", error);
    res.status(500).json({ message: "Unable to fetch items" });
  }
});

app.get("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item id" });
    }
    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(mapPublicItem(item));
  } catch (error) {
    console.error("item details error", error);
    res.status(500).json({ message: "Unable to fetch item" });
  }
});

app.get("/items/mine", authGuard, async (req, res) => {
  try {
    const items = await itemsCollection
      .find(buildOwnershipQuery(req.user.sub))
      .sort({ createdAt: -1 })
      .toArray();
    res.json(items.map(mapUserItem));
  } catch (error) {
    console.error("my items error", error);
    res.status(500).json({ message: "Unable to fetch managed items" });
  }
});

app.get("/products", authGuard, async (req, res) => {
  try {
    const products = await itemsCollection
      .find(buildOwnershipQuery(req.user.sub))
      .sort({ createdAt: -1 })
      .toArray();
    res.json(products.map(mapUserItem));
  } catch (error) {
    console.error("fetch products error", error);
    res.status(500).json({ message: "Unable to fetch products" });
  }
});

app.put("/products/:id", authGuard, handleUpdateProduct);

app.post("/items", authGuard, handleCreateProduct);
app.post("/products", authGuard, handleCreateProduct);

app.delete("/items/:id", authGuard, handleDeleteProduct);
app.delete("/products/:id", authGuard, handleDeleteProduct);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const gracefulShutdown = async () => {
  await client.close();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Dish Delight server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
