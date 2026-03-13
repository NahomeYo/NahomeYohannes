# Merge Sort

## Complexity

- Best: O(n log n)
- Worst: O(n log n)
- Avg: O(n log n)
- Space: O(n)

## Problem Description

Merge sort is a divide-and-conquer sorting algorithm. It splits the input array into smaller halves, sorts each half recursively, and then merges the sorted halves into one sorted result.

## Algorithm Steps

1. If the array has length 0 or 1, return it immediately because it is already sorted.
2. Find the middle index and split the array into a left half and a right half.
3. Recursively sort both halves.
4. Merge the two sorted halves by repeatedly taking the smaller front value.
5. Append any remaining values once one half is exhausted.
6. Return the merged sorted array.

## Explanation

Merge sort performs `O(n)` merge work at each recursive level, and there are `O(log n)` levels because the array is halved each time. That gives the algorithm a total runtime of `O(n log n)` in the best, average, and worst cases. This implementation creates sliced halves and merged output arrays, so it uses `O(n)` extra space.
