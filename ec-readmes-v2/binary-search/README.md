# Binary Search

## Complexity

- Best: O(n log n)
- Worst: O(n log n)
- Avg: O(n log n)
- Space: O(n)

## Problem Description

This page demonstrates binary search on a sorted copy of an input array. Binary search itself repeatedly compares the target to the middle value of the current search range and discards half of the remaining values after each comparison. Because the example begins with an unsorted array, it first sorts the data with merge sort and then performs binary search on that sorted result.

## Algorithm Steps

1. Copy the original array and sort that copy with merge sort so the data satisfies binary search's sorted input requirement.
2. Initialize `low` to the first index and `high` to the last index of the sorted array.
3. Compute the middle index of the current search range.
4. If the middle value matches the target, return that index from the sorted array.
5. If the target is smaller than the middle value, move the search range left by setting `high = mid - 1`.
6. If the target is larger than the middle value, move the search range right by setting `low = mid + 1`.
7. Repeat until the target is found or the search range becomes empty.

## Explanation

Binary search alone runs in `O(log n)` time because every comparison eliminates half of the remaining search range. In this implementation, however, the program first sorts the array with merge sort, which costs `O(n log n)` time and `O(n)` extra space. That sorting step dominates the total runtime, so the full example on this page runs in `O(n log n)` time and returns the target's index in the sorted copy, not in the original unsorted array.
