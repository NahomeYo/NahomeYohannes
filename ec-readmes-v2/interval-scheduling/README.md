# Interval Scheduling

## Complexity

- Best: O(n log n)
- Worst: O(n log n)
- Avg: O(n log n)
- Space: O(n)

## Problem Description

Interval scheduling selects the largest possible set of mutually compatible intervals. Two intervals are compatible when one starts at or after the other finishes. This implementation uses the standard greedy rule: sort by finishing time and always take the next interval that finishes earliest among the remaining compatible choices.

## Algorithm Steps

1. Sort the intervals by finishing time in ascending order.
2. Select the first interval in that sorted order.
3. Track the finish time of the most recently selected interval.
4. Scan the remaining intervals from left to right.
5. Whenever the current interval starts at or after the stored finish time, add it to the solution and update the stored finish time.
6. Return the full list of selected intervals after the scan completes.

## Explanation

The greedy choice is correct because selecting the interval with the earliest finish time leaves as much room as possible for later intervals. After sorting, the algorithm makes a single linear pass and keeps every interval that remains compatible with the current schedule. Sorting dominates the runtime, so the total time complexity is `O(n log n)`. This JavaScript implementation returns a new list of selected intervals, so the extra space used for the result is `O(n)` in the worst case.
