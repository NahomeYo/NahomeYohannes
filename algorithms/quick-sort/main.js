/**
 * Sort an array with quick sort using three-way partitioning.
 *
 * @param {number[]} values Input array.
 * @param {number} pivot Pivot value for the current partition.
 * @returns {number[]} Sorted array.
 */
function quickSort(values, pivot) {
    if (values.length <= 1) {
        return values;
    }

    const left = [];
    const right = [];
    const middle = [];

    for (let index = 0; index < values.length; index++) {
        const currentValue = values[index];

        // Partition values by comparing them to the pivot.
        if (currentValue < pivot) {
            left.push(currentValue);
        } else if (currentValue > pivot) {
            right.push(currentValue);
        } else {
            middle.push(currentValue);
        }
    }

    const sortedLeft = left.length > 0
        ? quickSort(left, left[Math.floor(Math.random() * left.length)])
        : [];
    const sortedRight = right.length > 0
        ? quickSort(right, right[Math.floor(Math.random() * right.length)])
        : [];

    return [...sortedLeft, ...middle, ...sortedRight];
}

/**
 * Run the quick-sort demonstration with a random pivot from the input array.
 *
 * @returns {void}
 */
function main() {
    const array = [4, 1, 6, 8, 9, 102, 55];
    const randomIndex = Math.floor(Math.random() * array.length);
    const pivot = array[randomIndex];

    console.log("Original array =", array);
    console.log("Pivot =", pivot);
    console.log("Sorted array =", quickSort(array, pivot));
}

main();
