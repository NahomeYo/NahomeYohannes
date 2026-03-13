# Elementary Algorithms

## Bubble Sort

### Complexity

- Best: O(n)
- Worst: O(n^2)
- Avg: O(n^2)
- Space: O(1)

### Problem Description

Bubble sort repeatedly compares adjacent values and swaps them when they are out of order until the array is sorted.

### Algorithm Steps

1. Scan the array from left to right, comparing each adjacent pair.
2. Swap a pair whenever the left value is greater than the right value.
3. After one pass, the largest unsorted value has moved to the end of the unsorted region.
4. Repeat on the remaining unsorted prefix until no swaps are needed.

### Explanation

This version uses a swapped flag so it can stop early when the array is already sorted, which gives a best case of `O(n)`. In the average and worst cases, bubble sort still performs quadratic work, but it uses only constant extra space because it sorts in place.

### Example/Demo

```
Original array = [42, 7, 91, 18, 63, 25, 4, 77, 56, 13]
Sorted array = [4, 7, 13, 18, 25, 42, 56, 63, 77, 91]
```

## Insertion Sort

### Complexity

- Best: O(n)
- Worst: O(n^2)
- Avg: O(n^2)
- Space: O(1)

### Problem Description

Insertion sort builds a sorted prefix one value at a time by inserting each new value into its correct position.

### Algorithm Steps

1. Treat the first element as a sorted prefix of length one.
2. Take the next value as the key to insert.
3. Shift larger sorted values one position to the right.
4. Place the key into the gap that remains.

### Explanation

Insertion sort is efficient on small or nearly sorted inputs because each key may move only a short distance. It still has `O(n^2)` average and worst-case time, but it sorts in place and needs only `O(1)` extra space.

### Example/Demo

```
Original array = [42, 7, 91, 18, 63, 25, 4, 77, 56, 13]
Sorted array = [4, 7, 13, 18, 25, 42, 56, 63, 77, 91]
```

## Selection Sort

### Complexity

- Best: O(n^2)
- Worst: O(n^2)
- Avg: O(n^2)
- Space: O(1)

### Problem Description

Selection sort repeatedly finds the smallest value in the unsorted suffix and swaps it into the next sorted position.

### Algorithm Steps

1. Assume the first unsorted position holds the smallest remaining value.
2. Scan the rest of the unsorted suffix to find the true minimum.
3. Swap that minimum into the next sorted position.
4. Repeat until the unsorted suffix is empty.

### Explanation

Selection sort performs the same number of comparisons regardless of the input order, so its runtime stays `O(n^2)` in every case. Its main advantage is the simple in-place structure and `O(1)` extra space usage.

### Example/Demo

```
Original array = [42, 7, 91, 18, 63, 25, 4, 77, 56, 13]
Sorted array = [4, 7, 13, 18, 25, 42, 56, 63, 77, 91]
```

## Linear Search

### Complexity

- Best: O(1)
- Worst: O(n)
- Avg: O(n)
- Space: O(1)

### Problem Description

Linear search scans the array from left to right until it finds the target value or reaches the end.

### Algorithm Steps

1. Start at the first element of the array.
2. Compare the current value to the target.
3. Return the current index as soon as a match is found.
4. Continue until the array ends, then return `-1` if the target is absent.

### Explanation

Linear search works on any unsorted or sorted array because it does not rely on any special ordering. Its simplicity makes it useful for small inputs, but in the worst case it must inspect every element, giving a runtime of `O(n)`.

### Example/Demo

```
Original array = [42, 7, 91, 18, 63, 25, 4, 77, 56, 13]
Target = 63
Result index = 4
```
