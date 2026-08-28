export const DELIVERY_FEE = 2.99;

// Mirrors OrderService's server-side math exactly, so what the customer
// sees in Cart/Checkout matches what they're actually charged: BOGO items
// only bill for half their quantity (rounded up), a first-ever order gets
// 50% off the item subtotal, and a store's delivery discount reduces (or
// zeroes) the flat delivery fee.
export function computeCartPricing({ items, deliveryFeeDiscountPercent, isFirstOrder, isPremium }) {
  let listSubtotal = 0;
  let billableSubtotal = 0;

  for (const item of items) {
    listSubtotal += item.price * item.quantity;
    const billableQuantity = item.badge === "BOGO" ? Math.ceil(item.quantity / 2) : item.quantity;
    billableSubtotal += item.price * billableQuantity;
  }

  const bogoSavings = listSubtotal - billableSubtotal;
  const firstOrderDiscount = isFirstOrder ? billableSubtotal * 0.5 : 0;

  let deliveryFee = 0;
  let deliveryFeeOriginal = null;
  if (!isPremium) {
    if (deliveryFeeDiscountPercent > 0) {
      deliveryFeeOriginal = DELIVERY_FEE;
      deliveryFee = DELIVERY_FEE * (1 - deliveryFeeDiscountPercent / 100);
    } else {
      deliveryFee = DELIVERY_FEE;
    }
  }

  const total = billableSubtotal - firstOrderDiscount + deliveryFee;

  return { listSubtotal, billableSubtotal, bogoSavings, firstOrderDiscount, deliveryFee, deliveryFeeOriginal, total };
}
