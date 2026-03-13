# Fibonacci

## Complexity

- Best: O(n)
- Worst: O(n)
- Avg: O(n)
- Space: O(n)

## Problem Description

This implementation computes the `n`th Fibonacci number with dynamic programming. The Fibonacci sequence starts with 0 and 1, and each later value is the sum of the two previous values. Instead of recomputing the same smaller values many times, the algorithm stores them in a table and builds the answer from the bottom up.

## Algorithm Steps

1. Create an array to store the Fibonacci values for smaller indices.
2. Set the base cases `F[0] = 0` and `F[1] = 1`.
3. Loop from index 2 up to `n`.
4. At each index, compute `F[i] = F[i - 1] + F[i - 2]`.
5. Return `F[n]` after the table is complete.

## Explanation

A naive recursive Fibonacci solution repeats the same subproblems many times and therefore has exponential runtime. This bottom-up dynamic programming version avoids that repetition by storing each Fibonacci value exactly once. The loop performs one constant-time update for each index from 2 through `n`, so the runtime is `O(n)`. The table stores all values from 0 through `n`, giving the implementation `O(n)` space usage.
