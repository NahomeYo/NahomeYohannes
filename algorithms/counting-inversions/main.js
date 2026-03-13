/**
 * Merge two sorted halves while counting cross inversions.
 *
 * @param {number[]} left Left sorted half.
 * @param {number[]} right Right sorted half.
 * @returns {{sorted: number[], inversions: number}} Merged output and inversion count.
 */
function mergeAndCount(left, right) {
    let leftIndex = 0;
    let rightIndex = 0;
    let sortedArray = [];
    let inversions = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex] <= right[rightIndex]) {
            sortedArray.push(left[leftIndex]);
            leftIndex++;
        } else {
            sortedArray.push(right[rightIndex]);
            // Every remaining left value forms an inversion with right[rightIndex].
            inversions += left.length - leftIndex;
            rightIndex++;
        }
    }

    sortedArray = sortedArray
        .concat(left.slice(leftIndex))
        .concat(right.slice(rightIndex));

    return { sorted: sortedArray, inversions };
}

/**
 * Count inversions in an array with a merge-sort-style divide-and-conquer approach.
 *
 * @param {number[]} values Input array.
 * @returns {{sorted: number[], inversions: number}} Sorted array and total inversion count.
 */
function countingInversions(values) {
    if (values.length <= 1) {
        return { sorted: values, inversions: 0 };
    }

    const mid = Math.floor(values.length / 2);
    const leftHalf = countingInversions(values.slice(0, mid));
    const rightHalf = countingInversions(values.slice(mid));
    const mergedResult = mergeAndCount(leftHalf.sorted, rightHalf.sorted);

    return {
        sorted: mergedResult.sorted,
        // Add inversions from both halves and from pairs that cross the midpoint.
        inversions:
            leftHalf.inversions +
            rightHalf.inversions +
            mergedResult.inversions,
    };
}

/**
 * Run the counting-inversions demonstration.
 *
 * @returns {void}
 */
function main() {
    const array = [42, 7, 91, 18, 63, 25, 4, 77, 56, 13];
    const result = countingInversions(array);

    console.log("Original array =", array);
    console.log("Sorted array =", result.sorted);
    console.log("Inversion count =", result.inversions);
}

main();
