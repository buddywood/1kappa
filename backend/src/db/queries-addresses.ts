import pool from './connection';

export interface UserAddress {
  id: number;
  user_id: number;
  label: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all addresses for a user
 */
export async function getUserAddresses(userId: number): Promise<UserAddress[]> {
  const result = await pool.query(
    'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return result.rows;
}

/**
 * Get default address for a user
 */
export async function getDefaultUserAddress(userId: number): Promise<UserAddress | null> {
  const result = await pool.query(
    'SELECT * FROM user_addresses WHERE user_id = $1 AND is_default = true LIMIT 1',
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Get a specific address by ID
 */
export async function getUserAddressById(addressId: number, userId: number): Promise<UserAddress | null> {
  const result = await pool.query(
    'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Create a new address for a user
 */
export async function createUserAddress(address: {
  user_id: number;
  label?: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  is_default?: boolean;
}): Promise<UserAddress> {
  // If this is being set as default, unset other defaults first
  if (address.is_default) {
    await pool.query(
      'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
      [address.user_id]
    );
  }

  const result = await pool.query(
    `INSERT INTO user_addresses (user_id, label, street, city, state, zip, country, is_default)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      address.user_id,
      address.label || null,
      address.street,
      address.city,
      address.state,
      address.zip,
      address.country || 'US',
      address.is_default || false,
    ]
  );
  return result.rows[0];
}

/**
 * Update an existing address
 */
export async function updateUserAddress(
  addressId: number,
  userId: number,
  updates: {
    label?: string | null;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    is_default?: boolean;
  }
): Promise<UserAddress | null> {
  // If this is being set as default, unset other defaults first
  if (updates.is_default) {
    await pool.query(
      'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
      [userId, addressId]
    );
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.label !== undefined) {
    fields.push(`label = $${paramIndex++}`);
    values.push(updates.label);
  }
  if (updates.street !== undefined) {
    fields.push(`street = $${paramIndex++}`);
    values.push(updates.street);
  }
  if (updates.city !== undefined) {
    fields.push(`city = $${paramIndex++}`);
    values.push(updates.city);
  }
  if (updates.state !== undefined) {
    fields.push(`state = $${paramIndex++}`);
    values.push(updates.state);
  }
  if (updates.zip !== undefined) {
    fields.push(`zip = $${paramIndex++}`);
    values.push(updates.zip);
  }
  if (updates.country !== undefined) {
    fields.push(`country = $${paramIndex++}`);
    values.push(updates.country);
  }
  if (updates.is_default !== undefined) {
    fields.push(`is_default = $${paramIndex++}`);
    values.push(updates.is_default);
  }

  if (fields.length === 0) {
    // No updates provided
    return getUserAddressById(addressId, userId);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(addressId, userId);

  const result = await pool.query(
    `UPDATE user_addresses 
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Delete an address
 */
export async function deleteUserAddress(addressId: number, userId: number): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id',
    [addressId, userId]
  );
  return result.rows.length > 0;
}

/**
 * Set an address as default (and unset others)
 */
export async function setDefaultAddress(addressId: number, userId: number): Promise<UserAddress | null> {
  // Unset all other defaults
  await pool.query(
    'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
    [userId]
  );

  // Set this one as default
  const result = await pool.query(
    'UPDATE user_addresses SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
    [addressId, userId]
  );

  return result.rows[0] || null;
}

