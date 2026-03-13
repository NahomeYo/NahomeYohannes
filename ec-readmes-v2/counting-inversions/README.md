# Counting Inversions

## Complexity

- Best: O(n log n)
- Worst: O(n log n)
- Avg: O(n log n)
- Space: O(n)

## Problem Description

Counting inversions measures how far an array is from being sorted. An inversion is a pair of indices `i < j` such that `S[i] > S[j]`. A sorted array has zero inversions, while a reverse-sorted array has the largest possible number.

## Algorithm Steps

1. Split the array recursively until each subarray has length 0 or 1.
2. Count the inversions in the left half.
3. Count the inversions in the right half.
4. Merge the two sorted halves back together.
5. Whenever a value from the right half is placed before the remaining values in the left half, add the number of unmerged left values to the inversion count.
6. Add the left, right, and cross-half inversion counts to obtain the final answer.

## Explanation

This implementation uses the same divide-and-conquer structure as merge sort. Each recursive level sorts the two halves and counts the inversions that stay entirely within those halves. During the merge step, if the next value comes from the right half before the current left value, that right value forms an inversion with every remaining value in the left half, so the algorithm can count several inversions in one step. Because each level does linear merge work across the array and there are `log n` levels, the runtime is `O(n log n)`. The implementation also uses `O(n)` extra space for the merged arrays.
