# Quick Sort

## Complexity

- Best: O(n log n)
- Worst: O(n^2)
- Avg: O(n log n)
- Space: O(n)

## Problem Description

This quick sort implementation chooses a pivot, partitions the array into values less than, equal to, and greater than that pivot, recursively sorts the left and right partitions, and concatenates the results.

## Algorithm Steps

1. If the array has length 0 or 1, return it because it is already sorted.
2. Choose a pivot value.
3. Partition the array into three groups: values less than the pivot, values equal to the pivot, and values greater than the pivot.
4. Recursively quick sort the left and right groups.
5. Concatenate the sorted left group, the middle group, and the sorted right group.

## Explanation

When the pivot splits the array fairly evenly, quick sort has about `log n` recursive levels and does `O(n)` partition work per level, giving an average runtime of `O(n log n)`. If the pivot choices are consistently unbalanced, the recursion can degenerate to `O(n^2)`. This version builds new `left`, `middle`, and `right` arrays during partitioning, so it uses `O(n)` additional space.
