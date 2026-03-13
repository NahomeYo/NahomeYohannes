/**
 * Select a maximum-size set of compatible intervals with the greedy finish-time rule.
 *
 * @param {Array<[number, number]>} intervals Input intervals as [start, end] pairs.
 * @returns {Array<[number, number]>} Selected non-overlapping intervals.
 */
function intervalScheduling(intervals) {
    const sortedIntervals = [...intervals].sort((a, b) => a[1] - b[1]);

    if (sortedIntervals.length === 0) {
        return [];
    }

    const compatible = [sortedIntervals[0]];
    let finishTime = sortedIntervals[0][1];

    for (let index = 1; index < sortedIntervals.length; index++) {
        const currentInterval = sortedIntervals[index];

        // Keep the interval only if it starts after or when the last one finishes.
        if (currentInterval[0] >= finishTime) {
            compatible.push(currentInterval);
            finishTime = currentInterval[1];
        }
    }

    return compatible;
}

/**
 * Convert interval pairs into a readable string for console output.
 *
 * @param {Array<[number, number]>} intervals Interval list.
 * @returns {string} Formatted interval string.
 */
function formatIntervals(intervals) {
    return intervals.map(([start, end]) => `[${start}, ${end}]`).join(", ");
}

/**
 * Run the interval-scheduling demonstration.
 *
 * @returns {void}
 */
function main() {
    const times = [
        [1, 4],
        [3, 5],
        [0, 6],
        [5, 7],
        [3, 9],
        [5, 9],
        [6, 10],
        [8, 11],
        [8, 12],
        [2, 14],
        [12, 16],
    ];

    console.log(`Original intervals = ${formatIntervals(times)}`);
    console.log(`Compatible intervals = ${formatIntervals(intervalScheduling(times))}`);
}

main();
