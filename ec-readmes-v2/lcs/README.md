# LCS

## Complexity

- Best: O(mn)
- Worst: O(mn)
- Avg: O(mn)
- Space: O(mn)

## Problem Description

The longest common subsequence algorithm finds the length of the longest sequence of characters that appears in both input strings while preserving order. The characters do not need to be adjacent, so a subsequence is more flexible than a substring.

## Algorithm Steps

1. Create a dynamic programming table with `m + 1` rows and `n + 1` columns.
2. Use the first row and first column as base cases for comparisons against an empty prefix.
3. Fill the table row by row.
4. If the current characters match, set the current cell to the diagonal value plus 1.
5. If the current characters differ, set the current cell to the larger of the value above and the value to the left.
6. Return the bottom-right value as the LCS length.

## Explanation

Each entry `dp[i][j]` stores the LCS length for the first `i` characters of the first string and the first `j` characters of the second string. When the current characters match, the subsequence can grow by one from the diagonal subproblem. When they differ, the best answer comes from skipping one character from either the first string or the second string. Because the table has `(m + 1)(n + 1)` cells and each cell takes constant time to compute, both the runtime and the space complexity are `O(mn)`.
