/**
 * Sort an array with bubble sort and stop early if a pass makes no swaps.
 *
 * @param {number[]} values Input array.
 * @returns {number[]} The same array reference, sorted in ascending order.
 */
function bubble(values) {
    for (let end = values.length - 1; end > 0; end--) {
        let swapped = false;

        for (let index = 0; index < end; index++) {
            if (values[index] > values[index + 1]) {
                const temp = values[index];
                values[index] = values[index + 1];
                values[index + 1] = temp;
                swapped = true;
            }
        }

        // If no swap occurred, the remaining prefix is already sorted.
        if (!swapped) {
            break;
        }
    }

    return values;
}

/**
 * Sort an array with insertion sort.
 *
 * @param {number[]} values Input array.
 * @returns {number[]} The same array reference, sorted in ascending order.
 */
function insertion(values) {
    for (let index = 1; index < values.length; index++) {
        const key = values[index];
        let position = index - 1;

        // Shift larger values right until the insertion point is found.
        while (position >= 0 && values[position] > key) {
            values[position + 1] = values[position];
            position--;
        }

        values[position + 1] = key;
    }

    return values;
}

/**
 * Sort an array with selection sort.
 *
 * @param {number[]} values Input array.
 * @returns {number[]} The same array reference, sorted in ascending order.
 */
function selection(values) {
    for (let start = 0; start < values.length - 1; start++) {
        let smallest = start;

        for (let index = start + 1; index < values.length; index++) {
            if (values[index] < values[smallest]) {
                smallest = index;
            }
        }

        const temp = values[start];
        values[start] = values[smallest];
        values[smallest] = temp;
    }

    return values;
}

/**
 * Search for a target value with linear search.
 *
 * @param {number[]} values Input array.
 * @param {number} target Value to locate.
 * @returns {number} Index of the target, or -1 if absent.
 */
function linearSearch(values, target) {
    for (let index = 0; index < values.length; index++) {
        if (values[index] === target) {
            return index;
        }
    }

    return -1;
}

/**
 * Run the elementary-algorithms demonstration.
 *
 * @returns {void}
 */
function main() {
    const array = [42, 7, 91, 18, 63, 25, 4, 77, 56, 13];
    const linearTarget = 63;

    console.log("Original array =", array);
    console.log("Bubble sort =", bubble([...array]));
    console.log("Insertion sort =", insertion([...array]));
    console.log("Selection sort =", selection([...array]));
    console.log("Linear search target =", linearTarget);
    console.log("Linear search result index =", linearSearch(array, linearTarget));
}

main();
