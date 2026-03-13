# Dijkstra

## Complexity

- Best: O(V^2 + E)
- Worst: O(V^2 + E)
- Avg: O(V^2 + E)
- Space: O(V + E)

## Problem Description

Dijkstra's algorithm finds the shortest path distances from one start vertex to every reachable vertex in a weighted graph with non-negative edge weights. This implementation stores a set of unvisited vertices and repeatedly selects the unvisited vertex with the smallest tentative distance before relaxing its outgoing edges.

## Algorithm Steps

1. Initialize every vertex distance to infinity except the start vertex, which begins at 0.
2. Place every vertex in the unvisited set.
3. Repeatedly choose the unvisited vertex with the smallest tentative distance.
4. For each outgoing edge from that vertex, test whether the path through the current vertex produces a shorter distance to the neighbor.
5. If the new path is shorter, update the neighbor's stored distance.
6. Remove the current vertex from the unvisited set because its shortest distance is finalized.
7. Continue until no unvisited vertices remain.

## Explanation

The key greedy idea is that once the algorithm selects the unvisited vertex with the smallest tentative distance, that distance is final as long as every edge weight is non-negative. This version does not use a priority queue. Instead, it scans the full unvisited set each round to find the next vertex to process, which costs `O(V)` per selection and leads to a total runtime of `O(V^2 + E)`. The graph representation and distance table together use `O(V + E)` space.
