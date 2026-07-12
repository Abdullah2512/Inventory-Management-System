const bcrypt = require("bcryptjs");

const { findUserByEmail, createUser } = require("../models/auth.model");
const { signToken } = require("../utils/jwt");
const { validateRegisterInput, validateLoginInput } = require("../utils/validators");

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * 201 - user created, returns { user, token }
 * 400 - missing/invalid fields
 * 409 - email already registered
 * 500 - unexpected error
 */
async function register(req, res) {
  try {
    const validation = validateRegisterInput(req.body || {});

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validation.errors
      });
    }

    const { name, email, password } = validation.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await createUser({ name, email, hashedPassword });
    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: newUser,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering the user.",
      error: error.message
    });
  }
}

/**
 * POST /api/auth/login
 * 200 - success, returns { user, token }
 * 400 - missing fields
 * 401 - invalid email or password
 * 500 - unexpected error
 */
async function login(req, res) {
  try {
    const validation = validateLoginInput(req.body || {});

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validation.errors
      });
    }

    const { email, password } = validation.data;

    const user = await findUserByEmail(email);

    // Same generic message whether the email doesn't exist or the
    // password is wrong, so we don't leak which one it was.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const safeUser = { id: user.id, name: user.name, email: user.email };
    const token = signToken(safeUser);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
      error: error.message
    });
  }
}

module.exports = {
  register,
  login
};
