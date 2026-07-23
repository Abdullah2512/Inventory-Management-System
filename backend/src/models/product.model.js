const supabase = require("../config/supabase");

const TABLE_NAME = "products";
const PRODUCT_COLUMNS = "id, name, category, price, quantity, image_url, created_at";

function parsePositiveInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function validateId(id) {
  const parsed = parsePositiveInteger(id, null);
  if (!parsed) {
    const error = new Error("Invalid product id.");
    error.status = 400;
    throw error;
  }
  return parsed;
}

async function findAll({ search, category, page = 1, limit = 8, sortBy = "id", sortOrder = "asc" } = {}) {
  let query = supabase
    .from(TABLE_NAME)
    .select(PRODUCT_COLUMNS, { count: "exact" });

  if (search && search.trim() !== "") {
    const value = search.trim().replace(/[%_]/g, "\\$&");
    query = query.or(`name.ilike.%${value}%,category.ilike.%${value}%`);
  }

  if (category && category.trim() !== "") {
    query = query.eq("category", category.trim());
  }

  const allowedSortFields = ["id", "name", "category", "price", "quantity", "created_at"];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "id";
  const finalSortOrder = String(sortOrder).toLowerCase() === "desc" ? "desc" : "asc";

  query = query.order(finalSortBy, { ascending: finalSortOrder === "asc" });

  const parsedPage = parsePositiveInteger(page, 1);
  const parsedLimit = Math.min(100, parsePositiveInteger(limit, 8));
  const from = (parsedPage - 1) * parsedLimit;
  const to = from + parsedLimit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw error;
  }

  const { data: statsData, error: statsError } = await supabase
    .from(TABLE_NAME)
    .select("price, quantity");

  if (statsError) {
    throw statsError;
  }

  const stats = (statsData || []).reduce(
    (accumulator, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      accumulator.totalProducts += 1;
      accumulator.totalStock += quantity;
      accumulator.totalValue += price * quantity;
      return accumulator;
    },
    { totalProducts: 0, totalStock: 0, totalValue: 0 }
  );

  const total = count || 0;

  return {
    products: data || [],
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
    stats
  };
}

async function findById(id) {
  const productId = validateId(id);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(PRODUCT_COLUMNS)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function create(product) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([product])
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function update(id, product) {
  const productId = validateId(id);
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(product)
    .eq("id", productId)
    .select(PRODUCT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function remove(id) {
  const productId = validateId(id);
  const existingProduct = await findById(productId);

  if (!existingProduct) {
    return false;
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", productId);

  if (error) {
    throw error;
  }

  return true;
}

async function getCategories() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("category");

  if (error) {
    throw error;
  }

  return [...new Set((data || []).map((item) => item.category))]
    .filter(Boolean)
    .sort();
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  getCategories
};
