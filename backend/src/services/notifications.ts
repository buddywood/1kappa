import { createNotification, getInterestedUsersForProduct } from '../db/queries-notifications-sequelize';
import { getProductsBySeller } from '../db/queries-sequelize';

/**
 * Notify all interested users when a seller's product becomes available
 * (i.e., when seller sets up Stripe account)
 */
export async function notifyInterestedUsersForSeller(sellerId: number, sellerName: string): Promise<void> {
  try {
    // Get all products for this seller
    const products = await getProductsBySeller(sellerId);

    // For each product, notify users who tried to purchase it
    for (const product of products) {
      const interestedUsers = await getInterestedUsersForProduct(product.id);

      // Create notifications for each interested user
      for (const userEmail of interestedUsers) {
        await createNotification({
          user_email: userEmail,
          type: 'ITEM_AVAILABLE',
          title: 'Item Now Available!',
          message: `"${product.name}" is now available for purchase! The seller has completed their payment setup.`,
          related_product_id: product.id,
        }).catch(error => {
          console.error(`Failed to notify user ${userEmail} about product ${product.id}:`, error);
        });
      }
    }

    console.log(`Notified interested users for seller ${sellerName} (${sellerId})`);
  } catch (error) {
    console.error(`Error notifying interested users for seller ${sellerId}:`, error);
    // Don't throw - notification failure shouldn't break the setup process
  }
}

/**
 * Notify user when admin modifies their product
 */
export async function notifyProductModified(
  userEmail: string,
  productName: string,
  adminReason: string
): Promise<void> {
  try {
    await createNotification({
      user_email: userEmail,
      type: 'ADMIN_ACTION',
      title: 'Product Modified by Admin',
      message: `Your product "${productName}" has been modified by an administrator. Reason: ${adminReason}`,
      related_product_id: null,
    });
    console.log(`✅ Created notification for ${userEmail} about product modification`);
  } catch (error) {
    console.error(`❌ Error creating product modified notification for ${userEmail}:`, error);
    // Don't throw - notification failure shouldn't break the modification process
  }
}

/**
 * Notify user when admin deletes their product
 */
export async function notifyProductDeleted(
  userEmail: string,
  productName: string,
  adminReason: string
): Promise<void> {
  try {
    await createNotification({
      user_email: userEmail,
      type: 'ADMIN_ACTION',
      title: 'Product Removed by Admin',
      message: `Your product "${productName}" has been removed by an administrator. Reason: ${adminReason}`,
      related_product_id: null,
    });
    console.log(`✅ Created notification for ${userEmail} about product deletion`);
  } catch (error) {
    console.error(`❌ Error creating product deleted notification for ${userEmail}:`, error);
    // Don't throw - notification failure shouldn't break the deletion process
  }
}

/**
 * Notify user when admin modifies their event
 */
export async function notifyEventModified(
  userEmail: string,
  eventTitle: string,
  adminReason: string
): Promise<void> {
  try {
    await createNotification({
      user_email: userEmail,
      type: 'ADMIN_ACTION',
      title: 'Event Modified by Admin',
      message: `Your event "${eventTitle}" has been modified by an administrator. Reason: ${adminReason}`,
      related_product_id: null,
    });
    console.log(`✅ Created notification for ${userEmail} about event modification`);
  } catch (error) {
    console.error(`❌ Error creating event modified notification for ${userEmail}:`, error);
    // Don't throw - notification failure shouldn't break the modification process
  }
}

/**
 * Notify user when admin cancels their event
 */
export async function notifyEventDeleted(
  userEmail: string,
  eventTitle: string,
  adminReason: string
): Promise<void> {
  try {
    await createNotification({
      user_email: userEmail,
      type: 'ADMIN_ACTION',
      title: 'Event Cancelled by Admin',
      message: `Your event "${eventTitle}" has been cancelled by an administrator. Reason: ${adminReason}`,
      related_product_id: null,
    });
    console.log(`✅ Created notification for ${userEmail} about event cancellation`);
  } catch (error) {
    console.error(`❌ Error creating event deleted notification for ${userEmail}:`, error);
    // Don't throw - notification failure shouldn't break the deletion process
  }
}

