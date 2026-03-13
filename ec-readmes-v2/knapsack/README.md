# Knapsack

## Complexity

- Best: O(nk)
- Worst: O(nk)
- Avg: O(nk)
- Space: O(nk)

## Problem Description

The 0-1 knapsack problem asks for the maximum total value that can fit within a fixed capacity when each item may be chosen at most once. This implementation uses dynamic programming to compute the best value for every prefix of items and every capacity from 0 through `k`.

## Algorithm Steps

1. Create a dynamic programming table with `n + 1` rows and `k + 1` columns.
2. Use row `i` to represent the first `i` items and column `j` to represent capacity `j`.
3. Initialize the first row and first column to 0 to represent empty-item and zero-capacity cases.
4. For each item and capacity, decide whether taking the item improves the best known value.
5. If the item fits, choose the larger of skipping it and taking it once.
6. If the item does not fit, copy the value from the row above.
7. Return the completed table after every row and capacity has been processed.

## Explanation

Each table entry `dp[i][j]` stores the best total value obtainable with the first `i` items and capacity `j`. If item `i` fits, the recurrence compares the value of skipping it, `dp[i - 1][j]`, with the value of taking it once, `dp[i - 1][j - weight] + value`. Because the table contains `(n + 1)(k + 1)` cells and each cell is filled in constant time, the runtime is `O(nk)` and the space usage is also `O(nk)`.
