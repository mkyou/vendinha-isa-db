export const calculatePaymentDistribution = (items, totalPaid) => {
    let remainingPayment = totalPaid;

    return items.map(item => {
        const itemTotal = item.quantity * item.price; // Ensure total is calculated from quantity * price
        let itemPaid = 0;

        if (remainingPayment >= itemTotal) {
            itemPaid = itemTotal;
            remainingPayment -= itemTotal;
        } else {
            itemPaid = remainingPayment;
            remainingPayment = 0;
        }

        return {
            ...item,
            total: itemTotal, // Ensure total is correct
            paid_amount: parseFloat(itemPaid.toFixed(2))
        };
    });
};
