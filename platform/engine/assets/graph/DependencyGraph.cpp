#include "engine/assets/graph/DependencyGraph.hpp"
#include <algorithm>

namespace platform
{
    void DependencyGraph::AddDependency(AssetID parent, AssetID child)
    {
        if (parent == kInvalidAssetID || child == kInvalidAssetID || parent == child)
        {
            return;
        }

        auto &children = m_adjacencyList[parent];
        if (std::find(children.begin(), children.end(), child) == children.end())
        {
            children.push_back(child);
        }

        auto &parents = m_reverseAdjacencyList[child];
        if (std::find(parents.begin(), parents.end(), parent) == parents.end())
        {
            parents.push_back(parent);
        }
    }

    void DependencyGraph::RemoveDependency(AssetID parent, AssetID child)
    {
        auto it = m_adjacencyList.find(parent);
        if (it != m_adjacencyList.end())
        {
            auto &vec = it->second;
            vec.erase(std::remove(vec.begin(), vec.end(), child), vec.end());
        }

        auto it2 = m_reverseAdjacencyList.find(child);
        if (it2 != m_reverseAdjacencyList.end())
        {
            auto &vec = it2->second;
            vec.erase(std::remove(vec.begin(), vec.end(), parent), vec.end());
        }
    }

    std::vector<AssetID> DependencyGraph::GetChildren(AssetID parent) const
    {
        auto it = m_adjacencyList.find(parent);
        if (it != m_adjacencyList.end())
        {
            return it->second;
        }
        return {};
    }

    std::vector<AssetID> DependencyGraph::GetParents(AssetID child) const
    {
        auto it = m_reverseAdjacencyList.find(child);
        if (it != m_reverseAdjacencyList.end())
        {
            return it->second;
        }
        return {};
    }

    std::vector<AssetID> DependencyGraph::GetRecursiveDependencies(AssetID root) const
    {
        std::vector<AssetID> result;
        std::unordered_set<AssetID> visited;

        auto traverse = [&](auto self, AssetID node) -> void {
            auto children = GetChildren(node);
            for (AssetID child : children)
            {
                if (visited.insert(child).second)
                {
                    result.push_back(child);
                    self(self, child);
                }
            }
        };

        traverse(traverse, root);
        return result;
    }

    bool DependencyGraph::DetectCircularDependencies() const
    {
        std::unordered_set<AssetID> visited;
        std::unordered_set<AssetID> recStack;

        for (const auto &[node, children] : m_adjacencyList)
        {
            if (visited.find(node) == visited.end())
            {
                if (HasCycleDFS(node, visited, recStack))
                {
                    return true;
                }
            }
        }
        return false;
    }

    bool DependencyGraph::HasCycleDFS(AssetID current, std::unordered_set<AssetID> &visited, std::unordered_set<AssetID> &recStack) const
    {
        visited.insert(current);
        recStack.insert(current);

        auto children = GetChildren(current);
        for (AssetID child : children)
        {
            if (visited.find(child) == visited.end())
            {
                if (HasCycleDFS(child, visited, recStack))
                {
                    return true;
                }
            }
            else if (recStack.find(child) != recStack.end())
            {
                return true; // Cycle found!
            }
        }

        recStack.erase(current);
        return false;
    }

    void DependencyGraph::Clear()
    {
        m_adjacencyList.clear();
        m_reverseAdjacencyList.clear();
    }
}
