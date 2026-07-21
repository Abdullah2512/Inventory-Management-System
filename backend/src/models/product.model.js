const supabase = require("../config/supabase");

const TABLE_NAME = "products";

async function findAll({ search, category, page = 1, limit = 8, sortBy = "id", sortOrder = "asc" } = {}) {
  let query = supabase
    .from(TABLE_NAME)
    .select("id, name, category, price, quantity", { count: "exact" });

  if (search && search.trim() !== "") {
    const s = search.trim();
    query = query.or(`name.ilike.%${s}%,category.ilike.%${s}%`);
  }

  if (category && category.trim() !== "") {
    query = query.eq("category", category.trim());
  }

  const allowedSortFields = ["name", "category", "price", "quantity", "id"];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "id";
  const finalSortOrder = sortOrder && sortOrder.toLowerCase() === "desc" ? "desc" : "asc";
  const isAscending = finalSortOrder === "asc";

  query = query.order(finalSortBy, { ascending: isAscending });

  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, parseInt(limit) || 8);
  const from = (parsedPage - 1) * parsedLimit;
  const to = from + parsedLimit - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / parsedLimit);

  const { data: allData, error: allDataError } = await supabase
    .from(TABLE_NAME)
    .select("price, quantity");

  let totalProducts = 0;
  let totalStock = 0;
  let totalValue = 0;

  if (!allDataError && allData) {
    totalProducts = allData.length;
    allData.forEach(item => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.price) || 0;
      totalStock += q;
      totalValue += p * q;
    });
  }

  return {
    products: data || [],
    total,
    page: parsedPage,
    totalPages: totalPages || 1,
    stats: {
      totalProducts,
      totalStock,
      totalValue
    }
  };
}

async function create(product) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(product)
    .select("id, name, category, price, quantity")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function update(id, product) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(product)
    .eq("id", id)
    .select("id, name, category, price, quantity")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function remove(id) {
  const existingProduct = await findById(id);

  if (!existingProduct) {
    return false;
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

async function findById(id) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getCategories() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("category");

  if (error) {
    throw error;
  }

  const categories = [...new Set((data || []).map(item => item.category))].filter(Boolean).sort();
  return categories;
}

module.exports = {
  findAll,
  create,
  update,
  remove,
  getCategories
};