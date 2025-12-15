// @ts-nocheck

import { Op } from 'sequelize';
import { UserAddress } from './models';
import { UserAddress as UserAddressType } from '../types';

/**
 * Get all addresses for a user
 */
export async function getUserAddresses(userId: number): Promise<UserAddressType[]> {
  const addresses = await UserAddress.findAll({
    where: { user_id: userId },
    order: [['is_default', 'DESC'], ['created_at', 'DESC']]
  });
  return addresses.map(addr => addr.toJSON() as UserAddressType);
}

/**
 * Get default address for a user
 */
export async function getDefaultUserAddress(userId: number): Promise<UserAddressType | null> {
  const address = await UserAddress.findOne({
    where: {
      user_id: userId,
      is_default: true
    }
  });
  return address ? (address.toJSON() as UserAddressType) : null;
}

/**
 * Get a specific address by ID
 */
export async function getUserAddressById(addressId: number, userId: number): Promise<UserAddressType | null> {
  const address = await UserAddress.findOne({
    where: {
      id: addressId,
      user_id: userId
    }
  });
  return address ? (address.toJSON() as UserAddressType) : null;
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
}): Promise<UserAddressType> {
  // If this is being set as default, unset other defaults first
  if (address.is_default) {
    await UserAddress.update(
      { is_default: false },
      { where: { user_id: address.user_id } }
    );
  }

  const newAddress = await UserAddress.create({
    user_id: address.user_id,
    label: address.label || null,
    street: address.street,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country || 'US',
    is_default: address.is_default || false
  });
  return newAddress.toJSON() as UserAddressType;
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
): Promise<UserAddressType | null> {
  // If this is being set as default, unset other defaults first
  if (updates.is_default) {
    await UserAddress.update(
      { is_default: false },
      { where: { user_id: userId, id: { [Op.ne]: addressId } } }
    );
  }

  const address = await UserAddress.findOne({
    where: {
      id: addressId,
      user_id: userId
    }
  });
  if (!address) return null;

  if (updates.label !== undefined) address.label = updates.label;
  if (updates.street !== undefined) address.street = updates.street;
  if (updates.city !== undefined) address.city = updates.city;
  if (updates.state !== undefined) address.state = updates.state;
  if (updates.zip !== undefined) address.zip = updates.zip;
  if (updates.country !== undefined) address.country = updates.country;
  if (updates.is_default !== undefined) address.is_default = updates.is_default;

  await address.save();
  return address.toJSON() as UserAddressType;
}

/**
 * Delete an address
 */
export async function deleteUserAddress(addressId: number, userId: number): Promise<boolean> {
  const result = await UserAddress.destroy({
    where: {
      id: addressId,
      user_id: userId
    }
  });
  return result > 0;
}

/**
 * Set an address as default (and unset others)
 */
export async function setDefaultAddress(addressId: number, userId: number): Promise<UserAddressType | null> {
  // Unset all other defaults
  await UserAddress.update(
    { is_default: false },
    { where: { user_id: userId } }
  );

  // Set this one as default
  const address = await UserAddress.findOne({
    where: {
      id: addressId,
      user_id: userId
    }
  });
  if (!address) return null;

  address.is_default = true;
  await address.save();
  return address.toJSON() as UserAddressType;
}

