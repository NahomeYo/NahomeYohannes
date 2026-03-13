/**
 * Compute the nth Fibonacci number with bottom-up dynamic programming.
 *
 * @param {number} n Target Fibonacci index.
 * @returns {number} The nth Fibonacci value.
 */
function fibonacci(n) {
    if (n === 0) {
        return 0;
    }

    const values = [];
    values[0] = 0;
    values[1] = 1;

    for (let index = 2; index <= n; index++) {
        // Each value depends only on the two previous Fibonacci values.
        values[index] = values[index - 1] + values[index - 2];
    }

    return values[n];
}

/**
 * Run the Fibonacci demonstration.
 *
 * @returns {void}
 */
function main() {
    const n = 8;

    console.log("Original input =", n);
    console.log("Fibonacci value =", fibonacci(n));
}

main();
