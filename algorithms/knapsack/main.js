/**
 * Solve the 0-1 knapsack problem with dynamic programming.
 *
 * @param {{weight: number, value: number}[]} items Available items.
 * @param {number} capacity Maximum total weight.
 * @returns {number[][]} Completed dynamic programming table.
 */
function knapsack(items, capacity) {
    const dp = Array.from({ length: items.length + 1 }, () => Array(capacity + 1).fill(0));

    for (let itemIndex = 1; itemIndex <= items.length; itemIndex++) {
        for (let currentCapacity = 0; currentCapacity <= capacity; currentCapacity++) {
            const currentItem = items[itemIndex - 1];

            if (currentItem.weight <= currentCapacity) {
                // Compare skipping the item with taking it once.
                dp[itemIndex][currentCapacity] = Math.max(
                    dp[itemIndex - 1][currentCapacity],
                    dp[itemIndex - 1][currentCapacity - currentItem.weight] + currentItem.value
                );
            } else {
                dp[itemIndex][currentCapacity] = dp[itemIndex - 1][currentCapacity];
            }
        }
    }

    return dp;
}

/**
 * Format the item list for console output.
 *
 * @param {{weight: number, value: number}[]} items Available items.
 * @returns {string} Formatted item string.
 */
function formatItems(items) {
    return items
        .map((item) => `{ weight: ${item.weight}, value: ${item.value} }`)
        .join(", ");
}

/**
 * Format a 2D dynamic programming table for console output.
 *
 * @param {number[][]} table Dynamic programming table.
 * @returns {string} Formatted table string.
 */
function formatTable(table) {
    return table.map((row) => `[${row.join(", ")}]`).join(", ");
}

/**
 * Run the knapsack demonstration.
 *
 * @returns {void}
 */
function main() {
    const items = [
        { weight: 2, value: 3 },
        { weight: 3, value: 4 },
        { weight: 4, value: 5 },
    ];
    const maxCapacity = 5;

    console.log(`Original items = ${formatItems(items)}`);
    console.log(`Max capacity = ${maxCapacity}`);
    console.log(`DP table = ${formatTable(knapsack(items, maxCapacity))}`);
}

main();
