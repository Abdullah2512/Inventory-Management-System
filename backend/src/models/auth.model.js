const supabase = require("../config/supabase");

/**
 * Find a user by email.
 * Returns the full row (including the hashed password, needed for login
 * comparison) or null if not found.
 */
async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, password")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Find a user by id, excluding the password hash.
 * Used by the auth middleware / "current user" checks.
 */
async function findUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Insert a new user row and return the created record
 * (excluding the password hash).
 */
async function createUser({ name, email, hashedPassword }) {
  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password: hashedPassword }])
    .select("id, name, email, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};
