/**
 * Sort an array with merge sort and return a new sorted array.
 *
 * @param {number[]} values Input array.
 * @returns {number[]} Sorted array.
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
 * Merge two sorted halves into one sorted array.
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

    // Append any leftover values from the unfinished half.
    return sorted.concat(left.slice(leftIndex), right.slice(rightIndex));
}

/**
 * Run the merge-sort demonstration.
 *
 * @returns {void}
 */
function main() {
    const array = [7, 3, 16, 12, 8];

    console.log("Original array =", array);
    console.log("Sorted array =", mergeSort([...array]));
}

main();
