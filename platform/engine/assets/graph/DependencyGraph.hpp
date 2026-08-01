#ifndef PLATFORM_ENGINE_ASSETS_GRAPH_DEPENDENCY_GRAPH_HPP
#define PLATFORM_ENGINE_ASSETS_GRAPH_DEPENDENCY_GRAPH_HPP

#include "engine/assets/AssetID.hpp"
#include <unordered_map>
#include <unordered_set>
#include <vector>

namespace platform
{
    class DependencyGraph
    {
    public:
        DependencyGraph() = default;

        void AddDependency(AssetID parent, AssetID child);
        void RemoveDependency(AssetID parent, AssetID child);

        [[nodiscard]] std::vector<AssetID> GetChildren(AssetID parent) const;
        [[nodiscard]] std::vector<AssetID> GetParents(AssetID child) const;
        [[nodiscard]] std::vector<AssetID> GetRecursiveDependencies(AssetID root) const;

        [[nodiscard]] bool DetectCircularDependencies() const;

        void Clear();

    private:
        bool HasCycleDFS(AssetID current, std::unordered_set<AssetID> &visited, std::unordered_set<AssetID> &recStack) const;

        std::unordered_map<AssetID, std::vector<AssetID>> m_adjacencyList;
        std::unordered_map<AssetID, std::vector<AssetID>> m_reverseAdjacencyList;
    };
}

#endif // PLATFORM_ENGINE_ASSETS_GRAPH_DEPENDENCY_GRAPH_HPP
