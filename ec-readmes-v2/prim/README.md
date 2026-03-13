# Prim

## Problem Description

Prim's algorithm builds a minimum spanning tree for a connected weighted graph. Starting from one chosen vertex, it repeatedly adds the lightest edge that connects a visited vertex to an unvisited vertex until all vertices are included.

## Algorithm Steps

1. Start from a chosen vertex and mark it as visited.
2. Push every edge leaving that start vertex into a min-heap.
3. Repeatedly remove the lightest edge from the heap.
4. If that edge leads to an already visited vertex, skip it.
5. Otherwise, add the edge to the minimum spanning tree, add its weight to the total cost, and mark the destination vertex as visited.
6. Push the destination vertex's outgoing edges to unvisited neighbors into the heap.
7. Continue until all vertices have been visited or no candidate edges remain.

## Explanation

This implementation uses a min-heap to always choose the lightest valid edge on the boundary between visited and unvisited vertices. That greedy rule is what makes Prim's algorithm correct for minimum spanning tree construction. The algorithm returns both the list of tree edges and the total weight of the resulting spanning tree.
