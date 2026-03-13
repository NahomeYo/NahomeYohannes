/**
 * Compute the length of the longest common subsequence of two strings.
 *
 * @param {string} first First input string.
 * @param {string} second Second input string.
 * @returns {number} LCS length.
 */
function lcs(first, second) {
    const rowCount = first.length;
    const columnCount = second.length;
    const dp = Array.from({ length: rowCount + 1 }, () => Array(columnCount + 1).fill(0));

    for (let row = 1; row <= rowCount; row++) {
        for (let column = 1; column <= columnCount; column++) {
            if (first[row - 1] === second[column - 1]) {
                // Matching characters extend the best diagonal subsequence.
                dp[row][column] = dp[row - 1][column - 1] + 1;
            } else {
                dp[row][column] = Math.max(dp[row - 1][column], dp[row][column - 1]);
            }
        }
    }

    return dp[rowCount][columnCount];
}

/**
 * Run the longest-common-subsequence demonstration.
 *
 * @returns {void}
 */
function main() {
    const first = "kitten";
    const second = "sitting";

    console.log("Original strings =", first, second);
    console.log("LCS length =", lcs(first, second));
}

main();
