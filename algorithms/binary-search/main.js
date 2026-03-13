/**
 * Perform binary search on a sorted array and return the target index.
 *
 * @param {number[]} values Sorted input array.
 * @param {number} target Value to locate.
 * @returns {number} Index of the target in the sorted array, or -1 if absent.
 */
function binarySearch(values, target) {
    let low = 0;
    let high = values.length - 1;

    while (low <= high) {
        // Recompute the midpoint for the current search range.
        const mid = Math.floor((low + high) / 2);

        if (values[mid] === target) {
            return mid;
        }

        // Discard the half that cannot contain the target.
        if (target > values[mid]) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return -1;
}

/**
 * Sort an array with merge sort and return a new sorted array.
 *
 * @param {number[]} values Input array.
 * @returns {number[]} Sorted copy of the input values.
 */
function mergeSort(values) {
    if (values.length <= 1) {
        return values;
    }

    const mid = Math.floor(values.length / 2);
    const left = mergeSort(values.slice(0, mid));
    const right = mergeSort(values.slice(mid));

    return merge(left, right);
}

/**
 * Merge two sorted arrays into one sorted array.
 *
 * @param {number[]} left Left sorted half.
 * @param {number[]} right Right sorted half.
 * @returns {number[]} Merged sorted output.
 */
function merge(left, right) {
    const sorted = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] <= right[rightIndex]) {
            sorted.push(left[leftIndex]);
            leftIndex++;
        } else {
            sorted.push(right[rightIndex]);
            rightIndex++;
        }
    }

    // Append whichever half still contains unmerged values.
    return sorted.concat(left.slice(leftIndex), right.slice(rightIndex));
}

/**
 * Run the binary-search demonstration with a sorted copy of an unsorted array.
 *
 * @returns {void}
 */
function main() {
    const array = [4, 67, 20, 88, 10, 83];
    const sortedArray = mergeSort([...array]);
    const randomIndex = Math.floor(Math.random() * array.length);
    const target = array[randomIndex];

    console.log("Original array =", array);
    console.log("Sorted array =", sortedArray);
    console.log("Target =", target);
    console.log("Found index in sorted array =", binarySearch(sortedArray, target));
}

main();
