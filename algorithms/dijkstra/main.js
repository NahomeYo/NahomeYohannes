/**
 * Compute shortest-path distances from a start node with Dijkstra's algorithm.
 *
 * This implementation finds the next vertex by scanning the unvisited set,
 * so its runtime is O(V^2 + E) instead of the priority-queue variant.
 *
 * @param {Object.<string, Array<[string, number]>>} graph Weighted adjacency list.
 * @param {string} start Starting node label.
 * @returns {{distances: Record<string, number>}} Final distance table.
 */
function dijkstra(graph, start) {
    const distances = {};
    const unvisitedNodes = new Set();

    for (const node in graph) {
        distances[node] = Infinity;
        unvisitedNodes.add(node);
    }

    distances[start] = 0;

    while (unvisitedNodes.size > 0) {
        let current = null;

        // Pick the unvisited node with the smallest tentative distance.
        for (const node of unvisitedNodes) {
            if (current === null || distances[node] < distances[current]) {
                current = node;
            }
        }

        if (current === null || distances[current] === Infinity) {
            break;
        }

        // Relax every outgoing edge from the current node.
        for (const [neighbor, weight] of graph[current]) {
            if (!unvisitedNodes.has(neighbor)) {
                continue;
            }

            const candidateDistance = distances[current] + weight;

            if (candidateDistance < distances[neighbor]) {
                distances[neighbor] = candidateDistance;
            }
        }

        unvisitedNodes.delete(current);
    }

    return { distances };
}

/**
 * Run the Dijkstra demonstration on a small weighted graph.
 *
 * @returns {void}
 */
function main() {
    const graph = {
        A: [["B", 4], ["C", 2]],
        B: [["A", 4], ["C", 1], ["D", 5]],
        C: [["A", 2], ["B", 1], ["D", 8], ["E", 10]],
        D: [["B", 5], ["C", 8], ["E", 2], ["F", 6]],
        E: [["C", 10], ["D", 2], ["F", 3]],
        F: [["D", 6], ["E", 3]],
    };

    console.log("Original graph =", JSON.stringify(graph));
    console.log("Start node =", "A");
    console.log("Shortest paths =", dijkstra(graph, "A"));
}

main();
