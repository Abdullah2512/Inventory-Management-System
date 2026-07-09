const supabase = require("../config/supabase");

const TABLE_NAME = "products";

async function findAll() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id, name, category, price, quantity")
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
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

module.exports = {
  findAll,
  create,
  update,
  remove
};
